import { supabase } from '@/integrations/supabase/client';
import { transactionCoordinator } from '../core/TransactionCoordinator';
import { eventBus } from '../core/EventBus';
import { logger } from '@/utils/logger';
import { dataConsistencyLayer } from '../core/DataConsistencyLayer';
import type { ProductFormData, UnitEntryForm } from '../inventory/types';
import type { Supplier } from './types';

export interface AcquisitionItem {
  // For existing products
  productId?: string;
  // For new products
  productData?: ProductFormData;
  // Common fields
  quantity: number;
  unitCost: number;
  unitEntries: UnitEntryForm[]; // For serialized products
  createsNewProduct: boolean;
}

export interface SupplierAcquisitionData {
  supplierId: string;
  transactionDate: Date;
  items: AcquisitionItem[];
  notes?: string;
}

export interface AcquisitionResult {
  success: boolean;
  transactionId?: string;
  productIds: string[];
  unitIds: string[];
  errors?: string[];
}

class SupplierAcquisitionService {
  async createAcquisition(data: SupplierAcquisitionData): Promise<AcquisitionResult> {
    const transactionId = await transactionCoordinator.beginTransaction({
      type: 'supplier_acquisition',
      supplierId: data.supplierId,
      itemCount: data.items.length
    });

    const result: AcquisitionResult = {
      success: false,
      productIds: [],
      unitIds: [],
      errors: []
    };

    try {
      // Validate supplier exists and is active
      const supplier = await this.validateSupplier(data.supplierId);
      if (!supplier) {
        throw new Error('Supplier not found or inactive');
      }

      let totalAmount = 0;
      const transactionItems = [];

      // Process each acquisition item
      for (const item of data.items) {
        const itemResult = await this.processAcquisitionItem(
          transactionId,
          data.supplierId,
          item
        );
        
        result.productIds.push(...itemResult.productIds);
        result.unitIds.push(...itemResult.unitIds);
        totalAmount += itemResult.totalCost;
        transactionItems.push(itemResult.transactionItem);
      }

      // Create supplier transaction record
      const supplierTransactionId = await this.createSupplierTransaction(
        transactionId,
        data.supplierId,
        totalAmount,
        data.transactionDate,
        data.notes
      );

      // Create transaction items
      await this.createTransactionItems(
        transactionId,
        supplierTransactionId,
        transactionItems
      );

      // Commit the transaction
      await transactionCoordinator.commitTransaction(transactionId);

      result.success = true;
      result.transactionId = supplierTransactionId;

      // Emit events for cache invalidation and UI updates
      eventBus.emit('supplier:acquisition_completed', {
        supplierId: data.supplierId,
        productIds: result.productIds,
        unitIds: result.unitIds,
        transactionId: supplierTransactionId
      });

      logger.info('Supplier acquisition completed successfully', {
        transactionId: supplierTransactionId,
        productsCreated: result.productIds.length,
        unitsCreated: result.unitIds.length
      });

    } catch (error) {
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      result.errors = [error instanceof Error ? error.message : 'Unknown error occurred'];
      logger.error('Supplier acquisition failed', { error, transactionId });
    }

    return result;
  }

  private async validateSupplier(supplierId: string): Promise<Supplier | null> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      logger.error('Supplier validation failed', { supplierId, error });
      return null;
    }

    return data as Supplier;
  }

  private async processAcquisitionItem(
    transactionId: string,
    supplierId: string,
    item: AcquisitionItem
  ) {
    let productId: string;
    const productIds: string[] = [];
    const unitIds: string[] = [];

    if (item.createsNewProduct && item.productData) {
      // Create new product
      productId = await this.createProduct(transactionId, item.productData);
      productIds.push(productId);
    } else if (item.productId) {
      // Use existing product
      productId = item.productId;
    } else {
      throw new Error('Invalid acquisition item: missing product data');
    }

    // Create or update product units
    const createdUnits = await this.createProductUnits(
      transactionId,
      productId,
      supplierId,
      item
    );
    unitIds.push(...createdUnits);

    // Update product stock for non-serialized products
    if (!item.productData?.has_serial && item.quantity > 0) {
      await this.updateProductStock(transactionId, productId, item.quantity);
    }

    const totalCost = item.unitCost * item.quantity;

    return {
      productIds,
      unitIds,
      totalCost,
      transactionItem: {
        productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost,
        productUnitIds: createdUnits,
        createsNewProduct: item.createsNewProduct,
        unitDetails: {
          entries: item.unitEntries,
          hasSerial: item.productData?.has_serial || false
        }
      }
    };
  }

  private async createProduct(
    transactionId: string,
    productData: ProductFormData
  ): Promise<string> {
    return transactionCoordinator.executeInTransaction(
      transactionId,
      'create_product',
      'inventory',
      async () => {
        const { data, error } = await supabase
          .from('products')
          .insert({
            brand: productData.brand || '',
            model: productData.model || '',
            price: productData.price || 0,
            min_price: productData.min_price,
            max_price: productData.max_price,
            description: productData.description,
            category_id: productData.category_id,
            year: productData.year,
            supplier: productData.supplier,
            threshold: productData.threshold || 0,
            has_serial: productData.has_serial,
            stock: productData.has_serial ? 0 : (productData.stock || 0)
          })
          .select('id')
          .single();

        if (error) {
          throw new Error(`Failed to create product: ${error.message}`);
        }

        return data.id;
      },
      async () => {
        // Compensation: This will be handled by the transaction coordinator
        logger.warn('Product creation compensation triggered');
      }
    );
  }

  private async createProductUnits(
    transactionId: string,
    productId: string,
    supplierId: string,
    item: AcquisitionItem
  ): Promise<string[]> {
    return transactionCoordinator.executeInTransaction(
      transactionId,
      'create_product_units',
      'inventory',
      async () => {
        const unitIds: string[] = [];

        if (item.unitEntries && item.unitEntries.length > 0) {
          // Create serialized units
          for (const unitEntry of item.unitEntries) {
            const { data, error } = await supabase
              .from('product_units')
              .insert({
                product_id: productId,
                supplier_id: supplierId,
                purchase_price: item.unitCost,
                purchase_date: new Date().toISOString(),
                serial_number: unitEntry.serial || '',
                color: unitEntry.color || null,
                storage: unitEntry.storage ? parseInt(unitEntry.storage.toString()) : null,
                ram: unitEntry.ram ? parseInt(unitEntry.ram.toString()) : null,
                battery_level: unitEntry.battery_level,
                price: unitEntry.price || item.unitCost,
                min_price: unitEntry.min_price,
                max_price: unitEntry.max_price,
                status: 'available'
              })
              .select('id')
              .single();

            if (error) {
              throw new Error(`Failed to create product unit: ${error.message}`);
            }

            unitIds.push(data.id);
          }
        } else if (item.quantity > 0) {
          // Create units for non-serialized products (for tracking purposes)
          for (let i = 0; i < item.quantity; i++) {
            const { data, error } = await supabase
              .from('product_units')
              .insert({
                product_id: productId,
                supplier_id: supplierId,
                purchase_price: item.unitCost,
                purchase_date: new Date().toISOString(),
                serial_number: `BATCH-${Date.now()}-${i}`,
                status: 'available'
              })
              .select('id')
              .single();

            if (error) {
              throw new Error(`Failed to create product unit: ${error.message}`);
            }

            unitIds.push(data.id);
          }
        }

        return unitIds;
      },
      async () => {
        logger.warn('Product units creation compensation triggered');
      }
    );
  }

  private async updateProductStock(
    transactionId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    return transactionCoordinator.executeInTransaction(
      transactionId,
      'update_product_stock',
      'inventory',
      async () => {
        // Get current stock first
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single();

        if (!product) {
          throw new Error('Product not found');
        }

        const newStock = product.stock + quantity;

        const { error } = await supabase
          .from('products')
          .update({
            stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        if (error) {
          throw new Error(`Failed to update product stock: ${error.message}`);
        }
      },
      async () => {
        // Compensation: Get current stock and subtract the added quantity
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single();
        
        if (product) {
          await supabase
            .from('products')
            .update({
              stock: Math.max(0, product.stock - quantity),
              updated_at: new Date().toISOString()
            })
            .eq('id', productId);
        }
      }
    );
  }

  private async createSupplierTransaction(
    transactionId: string,
    supplierId: string,
    totalAmount: number,
    transactionDate: Date,
    notes?: string
  ): Promise<string> {
    return transactionCoordinator.executeInTransaction(
      transactionId,
      'create_supplier_transaction',
      'inventory',
      async () => {
        const transactionNumber = this.generateTransactionNumber();

        const { data, error } = await supabase
          .from('supplier_transactions')
          .insert({
            supplier_id: supplierId,
            transaction_number: transactionNumber,
            type: 'purchase',
            total_amount: totalAmount,
            transaction_date: transactionDate.toISOString(),
            status: 'completed',
            notes
          })
          .select('id')
          .single();

        if (error) {
          throw new Error(`Failed to create supplier transaction: ${error.message}`);
        }

        return data.id;
      },
      async () => {
        logger.warn('Supplier transaction creation compensation triggered');
      }
    );
  }

  private async createTransactionItems(
    transactionId: string,
    supplierTransactionId: string,
    items: any[]
  ): Promise<void> {
    return transactionCoordinator.executeInTransaction(
      transactionId,
      'create_transaction_items',
      'inventory',
      async () => {
        const itemsToInsert = items.map(item => ({
          transaction_id: supplierTransactionId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total_cost: item.totalCost,
          product_unit_ids: item.productUnitIds,
          creates_new_product: item.createsNewProduct,
          unit_details: item.unitDetails
        }));

        const { error } = await supabase
          .from('supplier_transaction_items')
          .insert(itemsToInsert);

        if (error) {
          throw new Error(`Failed to create transaction items: ${error.message}`);
        }
      },
      async () => {
        logger.warn('Transaction items creation compensation triggered');
      }
    );
  }

  private generateTransactionNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-6);
    return `SUP-${dateStr}-${timeStr}`;
  }
}

export const supplierAcquisitionService = new SupplierAcquisitionService();