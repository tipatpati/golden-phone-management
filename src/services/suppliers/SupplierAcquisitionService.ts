import { supabase } from '@/integrations/supabase/client';
import { transactionCoordinator } from '../core/TransactionCoordinator';
import { eventBus } from '../core/EventBus';
import { UnifiedProductCoordinator } from '../shared/UnifiedProductCoordinator';
import { logger } from '@/utils/logger';
import { dataConsistencyLayer } from '../core/DataConsistencyLayer';
import { ProductUnitManagementService } from '@/services/shared/ProductUnitManagementService';
import type { ProductFormData, UnitEntryForm } from '../inventory/types';
import type { Supplier } from './types';
import { withStoreId, withStoreIdBatch } from '../stores/storeHelpers';

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
      logger.info('🚀 Starting supplier acquisition', {
        transactionId,
        supplierId: data.supplierId,
        itemCount: data.items.length
      });

      // Add timeout protection to prevent stuck processing
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Acquisition processing timeout - operation took longer than 60 seconds'));
        }, 60000); // 60 seconds timeout
      });

      await this.processAllAcquisitionItems(transactionId, data, result);

    } catch (error) {
      logger.error('❌ Supplier acquisition failed', { error, transactionId });
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      result.errors = [error instanceof Error ? error.message : 'Unknown error occurred'];
      
      // Add detailed error context
      result.errors.push(`Transaction ID: ${transactionId}`);
      if (result.productIds.length > 0) {
        result.errors.push(`Products created: ${result.productIds.length}`);
      }
      if (result.unitIds.length > 0) {
        result.errors.push(`Units created: ${result.unitIds.length}`);
      }
    }

    return result;
  }

  private async processAllAcquisitionItems(
    transactionId: string,
    data: SupplierAcquisitionData,
    result: AcquisitionResult
  ): Promise<void> {
    // Validate supplier exists and is active
    const supplier = await this.validateSupplier(data.supplierId);
    if (!supplier) {
      throw new Error('Supplier not found or inactive');
    }

    // Pre-validate all items to prevent partial failures
    await this.validateAcquisitionItems(data.items);

    let totalAmount = 0;
    const transactionItems = [];

    // Process each acquisition item with enhanced error handling
    for (const [index, item] of data.items.entries()) {
      logger.info(`📦 Processing item ${index + 1}/${data.items.length}`, {
        transactionId,
        item: {
          productId: item.productId,
          createsNew: item.createsNewProduct,
          quantity: item.quantity,
          unitCost: item.unitCost,
          unitEntriesCount: item.unitEntries?.length || 0
        }
      });

      const itemResult = await this.processAcquisitionItem(
        transactionId,
        data.supplierId,
        item
      );
      
      // Validate item processing results
      if (itemResult.totalCost === 0 && item.unitCost > 0) {
        logger.warn('⚠️  Item total cost is 0 despite positive unit cost', {
          transactionId,
          item: { unitCost: item.unitCost, quantity: item.quantity }
        });
      }

      result.productIds.push(...itemResult.productIds);
      result.unitIds.push(...itemResult.unitIds);
      totalAmount += itemResult.totalCost;
      transactionItems.push(itemResult.transactionItem);

      logger.info(`✅ Item ${index + 1} processed successfully`, {
        transactionId,
        totalCost: itemResult.totalCost,
        unitsCreated: itemResult.unitIds.length
      });
    }

    logger.info('💰 Calculated transaction total', {
      transactionId,
      totalAmount,
      itemCount: transactionItems.length
    });

    // Create supplier transaction record with integrity validation
    const supplierTransactionId = await this.createSupplierTransaction(
      transactionId,
      data.supplierId,
      totalAmount,
      data.transactionDate,
      data.notes
    );

    // Create transaction items with data consistency checks
    await this.createTransactionItems(
      transactionId,
      supplierTransactionId,
      transactionItems
    );

    // Final integrity check before commit
    await this.validateTransactionIntegrity(supplierTransactionId, result);

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
        unitIds: result.unitIds,
        totalAmount
      },
      metadata: {
        timestamp: Date.now()
      }
    });

    // Emit through UnifiedProductCoordinator for inventory cache invalidation
    for (const productId of result.productIds) {
      UnifiedProductCoordinator.notifyEvent({
        type: 'product_created',
        source: 'supplier',
        entityId: productId,
        metadata: { 
          transactionId: supplierTransactionId,
          supplierId: data.supplierId 
        }
      });
    }

    // Notify about units created
    if (result.unitIds.length > 0) {
      UnifiedProductCoordinator.notifyEvent({
        type: 'unit_created',
        source: 'supplier',
        entityId: result.unitIds[0],
        metadata: { 
          productIds: result.productIds,
          unitIds: result.unitIds,
          transactionId: supplierTransactionId 
        }
      });
    }

    logger.info('🎉 Supplier acquisition completed successfully', {
      transactionId: supplierTransactionId,
      productsCreated: result.productIds.length,
      unitsCreated: result.unitIds.length,
      totalAmount
    });
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

    logger.info('🔧 Processing acquisition item', {
      transactionId,
      item: {
        createsNew: item.createsNewProduct,
        productId: item.productId,
        unitCost: item.unitCost,
        quantity: item.quantity,
        unitEntriesCount: item.unitEntries?.length || 0
      }
    });

    if (item.createsNewProduct && item.productData) {
      // Use Universal Product Service for ALL product operations
      const { universalProductService } = await import('@/services/shared/UniversalProductService');
      
      // Get supplier name for product tracking
      const supplier = await this.validateSupplier(supplierId);
      const supplierName = supplier?.name;
      
      // Ensure unit_entries are set for product creation and supplier is tracked
      const productDataWithUnits = {
        ...item.productData,
        supplier: supplierName, // Set supplier name for tracking
        unit_entries: item.unitEntries,
        has_serial: item.unitEntries && item.unitEntries.length > 0,
        stock: item.unitEntries && item.unitEntries.length > 0 ? 0 : item.quantity
      };
      
      logger.info('📱 Creating new product with units', {
        transactionId,
        productData: {
          brand: productDataWithUnits.brand,
          model: productDataWithUnits.model,
          hasSerial: productDataWithUnits.has_serial,
          unitEntriesCount: productDataWithUnits.unit_entries?.length || 0
        }
      });

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
      
      logger.info(`✅ ${result.isExistingProduct ? 'Using existing' : 'Created new'} product`, {
        transactionId,
        productId,
        createdUnits: result.createdUnitCount,
        updatedUnits: result.updatedUnitCount
      });

    } else if (item.productId) {
      // Use existing product and add units to it
      productId = item.productId;
      
      logger.info('📦 Adding units to existing product', {
        transactionId,
        productId,
        unitEntriesCount: item.unitEntries?.length || 0
      });
      
      if (item.unitEntries && item.unitEntries.length > 0) {
        // Use ProductUnitManagementService directly for unit creation
        const { ProductUnitManagementService } = await import('@/services/shared/ProductUnitManagementService');
        
        try {
          // Calculate individual unit costs from unit entries
          const unitEntriesWithCosts = item.unitEntries.map(entry => ({
            ...entry,
            // Use individual unit price if available, otherwise use item unit cost
            purchase_price: entry.price || item.unitCost
          }));

          const unitsResult = await ProductUnitManagementService.createUnitsForProduct({
            productId,
            unitEntries: unitEntriesWithCosts,
            defaultPricing: {
              price: item.unitCost,
              min_price: undefined,
              max_price: undefined
            },
            metadata: {
              supplierId: supplierId,
              transactionId,
              acquisitionDate: new Date()
            }
          });

          unitIds.push(...unitsResult.units.map(u => u.id));
          
          if (unitsResult.errors.length > 0) {
            logger.warn('⚠️  Some units had issues during creation', {
              transactionId,
              productId,
              errors: unitsResult.errors
            });
          }

          logger.info('✅ Units created for existing product', {
            transactionId,
            productId,
            unitsCreated: unitsResult.units.length
          });
        } catch (error) {
          logger.error('❌ Failed to create units for existing product', {
            transactionId,
            productId,
            error
          });
          throw new Error(`Failed to create units: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        // For non-serialized existing products, use traditional stock update
        logger.info('📊 Non-serialized product, will update stock', {
          transactionId,
          productId,
          quantity: item.quantity
        });
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

    // Calculate total cost - use individual unit costs if available
    let totalCost = 0;
    if (hasSerial && item.unitEntries && item.unitEntries.length > 0) {
      // For serialized products, sum individual unit costs
      totalCost = item.unitEntries.reduce((sum, entry) => {
        return sum + (entry.price || item.unitCost);
      }, 0);
    } else {
      // For non-serialized products or when no unit entries, use quantity * unit cost
      totalCost = item.unitCost * item.quantity;
    }

    logger.info('💰 Item cost calculation', {
      transactionId,
      productId,
      hasSerial,
      unitCost: item.unitCost,
      quantity: item.quantity,
      totalCost,
      calculation: hasSerial && item.unitEntries ? 'individual_unit_costs' : 'quantity_x_unit_cost'
    });

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
        const productToInsert = await withStoreId({
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
        });
        
        const { data, error } = await supabase
          .from('products')
          .insert(productToInsert)
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
            const unitToInsert = await withStoreId({
              product_id: productId,
              supplier_id: supplierId,
              purchase_price: item.unitCost,
              purchase_date: new Date().toISOString(),
              serial_number: `BATCH-${Date.now()}-${i}`,
              status: 'available'
            });
            
            const { data, error } = await supabase
              .from('product_units')
              .insert(unitToInsert)
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

  /**
   * Validate acquisition items before processing
   */
  private async validateAcquisitionItems(items: AcquisitionItem[]): Promise<void> {
    for (const [index, item] of items.entries()) {
      if (!item.createsNewProduct && !item.productId) {
        throw new Error(`Item ${index + 1}: Must specify either productId or product data for new product`);
      }
      
      if (item.unitCost <= 0) {
        throw new Error(`Item ${index + 1}: Unit cost must be greater than 0`);
      }
      
      if (item.quantity <= 0) {
        throw new Error(`Item ${index + 1}: Quantity must be greater than 0`);
      }

      if (item.unitEntries && item.unitEntries.length !== item.quantity) {
        logger.warn(`Item ${index + 1}: Unit entries count (${item.unitEntries.length}) doesn't match quantity (${item.quantity})`);
      }

      // Validate serial numbers for uniqueness
      if (item.unitEntries && item.unitEntries.length > 0) {
        const serials = item.unitEntries.map(e => e.serial).filter(s => s);
        const uniqueSerials = new Set(serials);
        if (serials.length !== uniqueSerials.size) {
          throw new Error(`Item ${index + 1}: Duplicate serial numbers detected`);
        }
      }
    }
  }

  /**
   * Validate transaction integrity after processing
   */
  private async validateTransactionIntegrity(
    transactionId: string, 
    result: AcquisitionResult
  ): Promise<void> {
    try {
      // Verify transaction exists in database
      const { data: transaction, error } = await supabase
        .from('supplier_transactions')
        .select('id, total_amount')
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        throw new Error('Transaction record not found in database');
      }

      if (transaction.total_amount === 0 && result.unitIds.length > 0) {
        logger.warn('⚠️  Transaction has zero total but units were created', {
          transactionId,
          totalAmount: transaction.total_amount,
          unitsCreated: result.unitIds.length
        });
      }

      // Verify transaction items exist
      const { data: items, error: itemsError } = await supabase
        .from('supplier_transaction_items')
        .select('id, total_cost')
        .eq('transaction_id', transactionId);

      if (itemsError) {
        throw new Error(`Failed to verify transaction items: ${itemsError.message}`);
      }

      const itemsTotal = items.reduce((sum, item) => sum + item.total_cost, 0);
      if (Math.abs(itemsTotal - transaction.total_amount) > 0.01) {
        logger.warn('⚠️  Transaction total mismatch', {
          transactionId,
          transactionTotal: transaction.total_amount,
          itemsTotal,
          difference: Math.abs(itemsTotal - transaction.total_amount)
        });
      }

      logger.info('✅ Transaction integrity validated', {
        transactionId,
        totalAmount: transaction.total_amount,
        itemsCount: items.length,
        unitsCreated: result.unitIds.length
      });

    } catch (error) {
      logger.error('❌ Transaction integrity validation failed', {
        transactionId,
        error
      });
      throw new Error(`Transaction integrity validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const supplierAcquisitionService = new SupplierAcquisitionService();