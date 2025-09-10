import { supabase } from '@/integrations/supabase/client';
import { transactionCoordinator } from '../core/TransactionCoordinator';
import { eventBus } from '../core/EventBus';
import { logger } from '@/utils/logger';
import { dataConsistencyLayer } from '../core/DataConsistencyLayer';
import { ProductUnitManagementService } from '@/services/shared/ProductUnitManagementService';
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
      eventBus.emit({
        type: 'supplier_acquisition_completed',
        module: 'inventory',
        operation: 'create',
        entityId: supplierTransactionId,
        data: {
          supplierId: data.supplierId,
          productIds: result.productIds,
          unitIds: result.unitIds
        },
        metadata: {
          timestamp: Date.now()
        }
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
      // Use Universal Product Service for ALL product operations
      const { universalProductService } = await import('@/services/shared/UniversalProductService');
      
      // Ensure unit_entries are set for product creation
      const productDataWithUnits = {
        ...item.productData,
        unit_entries: item.unitEntries,
        has_serial: item.unitEntries && item.unitEntries.length > 0,
        stock: item.unitEntries && item.unitEntries.length > 0 ? 0 : item.quantity
      };
      
      const result = await universalProductService.processProduct(productDataWithUnits, {
        source: 'supplier',
        transactionId,
        unitCost: item.unitCost,
        supplierId: supplierId,
        metadata: {
          acquisition: true,
          quantity: item.quantity
        }
      });

      if (!result.success) {
        throw new Error(`Failed to create/resolve product: ${result.errors.join(', ')}`);
      }

      productId = result.product!.id;
      if (!result.isExistingProduct) {
        productIds.push(productId);
      }
      
      // Units are handled by the universal service
      unitIds.push(...result.units.map(u => u.id));
      
      console.log(`✅ ${result.isExistingProduct ? 'Using existing' : 'Created new'} product: ${productId}`);
      console.log(`✅ Processed ${result.createdUnitCount} new units, ${result.updatedUnitCount} updated units`);

    } else if (item.productId) {
      // Use existing product and add units to it using Universal Product Service
      productId = item.productId;
      
      if (item.unitEntries && item.unitEntries.length > 0) {
        // Use Universal Product Service to add units to existing product
        const { universalProductService } = await import('@/services/shared/UniversalProductService');
        
        // Get existing product data
        const productData = await universalProductService.getProductWithUnits(productId);
        
        if (!productData.product) {
          throw new Error(`Product ${productId} not found`);
        }
        
        // Create form data for universal service by merging existing product with new units
        // CRITICAL: Merge existing units with new units to prevent data loss
        const existingUnits = productData.unitEntries || [];
        const newUnits = item.unitEntries || [];
        const allUnits = [...existingUnits, ...newUnits];
        
        const formData = {
          ...productData.product,
          unit_entries: allUnits,
          has_serial: true, // Products with unit entries are serialized
          stock: 0 // Will be calculated based on actual units
        };
        
        const result = await universalProductService.processProduct(formData, {
          source: 'supplier',
          transactionId,
          unitCost: item.unitCost,
          supplierId: supplierId,
          metadata: {
            acquisition: true,
            existingProduct: true,
            quantity: item.quantity
          }
        });

        if (!result.success) {
          throw new Error(`Failed to add units to existing product: ${result.errors.join(', ')}`);
        }

        unitIds.push(...result.units.map(u => u.id));
        console.log(`✅ Added ${result.createdUnitCount} new units, updated ${result.updatedUnitCount} units for existing product: ${productId}`);
      } else {
        // For non-serialized existing products, use traditional stock update
        console.log(`📦 Updating stock for non-serialized product: ${productId}`);
        // We'll handle stock updates separately for non-serialized products
      }
    } else {
      throw new Error('Invalid acquisition item: missing product data');
    }

    // Determine if product is serialized
    const hasSerial = item.createsNewProduct
      ? (item.productData?.has_serial ?? false)
      : await this.getProductHasSerial(productId);

    // Update product stock only for non-serialized products
    if (!hasSerial && item.quantity > 0) {
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
        productUnitIds: unitIds,
        createsNewProduct: item.createsNewProduct,
        unitDetails: {
          entries: item.unitEntries,
          hasSerial: hasSerial
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
          // Check if units already exist to prevent duplication
          const existingUnits = await ProductUnitManagementService.getUnitsForProduct(productId);
          const existingSerials = new Set(existingUnits.map(u => u.serial_number));
          const newEntries = item.unitEntries.filter(e => !existingSerials.has(e.serial));
          
          if (newEntries.length > 0) {
            // Use unified service for unit creation with integrated barcode generation
            const unitsResult = await ProductUnitManagementService.createUnitsForProduct({
              productId,
              unitEntries: newEntries,
              defaultPricing: {
                price: item.unitCost,
                min_price: item.unitCost * 1.2,
                max_price: item.unitCost * 1.5
              },
              metadata: {
                supplierId: supplierId,
                transactionId,
                acquisitionDate: new Date()
              }
            });

            unitIds.push(...unitsResult.units.map(u => u.id));
            
            if (unitsResult.errors.length > 0) {
              logger.warn('Some units had issues during creation:', unitsResult.errors);
            }
            
            console.log(`✅ Created ${newEntries.length} new units (${existingUnits.length} already existed)`);
          } else {
            console.log(`✅ All ${item.unitEntries.length} units already exist, skipping creation`);
            unitIds.push(...existingUnits.map(u => u.id));
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

  private async getProductHasSerial(productId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('products')
      .select('has_serial')
      .eq('id', productId)
      .single();
    if (error || !data) {
      logger.warn('Failed to fetch has_serial for product, defaulting to false', { productId, error });
      return false;
    }
    return Boolean(data.has_serial);
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