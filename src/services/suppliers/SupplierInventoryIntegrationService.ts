import { supabase } from '@/integrations/supabase/client';
import { eventBus, EVENT_TYPES } from '@/services/core/EventBus';
import { logger } from '@/utils/logger';
import { withStoreIdBatch } from '../stores/storeHelpers';

/**
 * Service to handle synchronization between supplier transactions and inventory
 */
export class SupplierInventoryIntegrationService {
  private static isInitialized = false;
  private static channel: any = null;
  
  /**
   * Initialize integration listeners
   */
  static initialize(): void {
    if (this.isInitialized) {
      logger.info('🔗 SupplierInventoryIntegrationService already initialized, skipping...');
      return;
    }
    
    logger.info('🔗 Initializing SupplierInventoryIntegrationService...');
    
    // Listen for transaction completion events
    this.setupTransactionListeners();
    this.isInitialized = true;
    
    logger.info('✅ SupplierInventoryIntegrationService initialized');
  }

  /**
   * Cleanup integration listeners
   */
  static cleanup(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isInitialized = false;
    logger.info('🧹 SupplierInventoryIntegrationService cleaned up');
  }

  /**
   * Set up real-time listeners for transaction changes
   */
  private static setupTransactionListeners(): void {
    // Listen for supplier transaction status changes
    this.channel = supabase
      .channel('supplier-inventory-integration')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_transactions',
          filter: 'status=eq.completed'
        },
        async (payload) => {
          logger.info('🔄 Transaction completed, syncing inventory...', payload.new);
          await this.syncTransactionToInventory(payload.new.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supplier_transaction_items'
        },
        async (payload) => {
          logger.info('🔄 Transaction item added, syncing inventory...', payload.new);
          await this.syncTransactionItemToInventory(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_transaction_items'
        },
        async (payload) => {
          logger.info('🔄 Transaction item updated, syncing inventory...', payload.new);
          await this.syncTransactionItemToInventory(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'supplier_transaction_items'
        },
        async (payload) => {
          logger.info('🔄 Transaction item deleted, syncing inventory...', payload.old);
          await this.handleTransactionItemDeletion(payload.old);
        }
      )
      .subscribe();
  }

  /**
   * Sync completed transaction to inventory
   */
  static async syncTransactionToInventory(transactionId: string): Promise<void> {
    try {
      logger.info(`🔄 Syncing transaction ${transactionId} to inventory...`);

      // Get transaction with items
      const { data: transaction, error: transactionError } = await supabase
        .from('supplier_transactions')
        .select(`
          *,
          supplier_transaction_items (
            *,
            products (*)
          )
        `)
        .eq('id', transactionId)
        .single();

      if (transactionError || !transaction) {
        logger.error('Failed to fetch transaction for sync:', transactionError);
        return;
      }

      // Only sync purchase transactions that are completed
      if (transaction.type !== 'purchase' || transaction.status !== 'completed') {
        logger.info(`Skipping sync for transaction ${transactionId} (type: ${transaction.type}, status: ${transaction.status})`);
        return;
      }

      // Sync each item to inventory
      for (const item of transaction.supplier_transaction_items || []) {
        await this.syncTransactionItemToInventory(item);
      }

      // Emit coordination event
      await eventBus.emit({
        type: EVENT_TYPES.SUPPLIER_TRANSACTION_UPDATED,
        module: 'suppliers',
        operation: 'update',
        entityId: transactionId,
        data: { 
          transactionType: transaction.type,
          itemCount: transaction.supplier_transaction_items?.length || 0,
          synced: true
        }
      });

      logger.info(`✅ Successfully synced transaction ${transactionId} to inventory`);
    } catch (error) {
      logger.error(`❌ Failed to sync transaction ${transactionId} to inventory:`, error);
    }
  }

  /**
   * Sync individual transaction item to inventory
   */
  static async syncTransactionItemToInventory(item: any): Promise<void> {
    try {
      logger.info(`🔄 Syncing item ${item.id} to inventory...`, {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        has_unit_details: !!item.unit_details,
        entries_count: item.unit_details?.entries?.length || 0,
        entries_with_pricing: item.unit_details?.entries?.filter(e => e.price || e.min_price || e.max_price).length || 0,
        entries_sample: item.unit_details?.entries?.slice(0, 3).map(e => ({ 
          serial: e.serial, 
          price: e.price, 
          min_price: e.min_price, 
          max_price: e.max_price,
          hasValidPricing: !!(e.price || e.min_price || e.max_price)
        })) || []
      });
      
      if (item.unit_details?.entries?.length) {
        console.log('🎯 [CRITICAL] Inventory service received unit entries with pricing data:');
        item.unit_details.entries.forEach((entry, idx) => {
          console.log(`  Entry ${idx}: ${entry.serial} - price: ${entry.price}, min: ${entry.min_price}, max: ${entry.max_price}`);
        });
      } else {
        console.warn('⚠️ [CRITICAL] No unit entries in unit_details - pricing templates will not be applied to inventory!');
      }

      const product = item.products || await this.getProductById(item.product_id);
      if (!product) {
        logger.error(`Product ${item.product_id} not found for sync`);
        return;
      }

      // Update product stock for purchase transactions
      await this.updateProductStock(item.product_id, item.quantity, 'add');

      // Prepare base updates for product units
      const baseUpdates = {
        purchase_price: item.unit_cost,
        purchase_date: new Date().toISOString(),
        status: 'available',
        product_id: item.product_id
      };

      // Handle both old and new data structures for pricing
      if (item.unit_details?.entries?.length) {
        logger.info('💰 Processing individual unit pricing from entries');
        
        // Check if we have existing unit IDs to update
        if (item.product_unit_ids?.length) {
          logger.info('🔄 Updating existing units with new pricing from entries');
          await this.updateProductUnitsWithIndividualPricing(
            item.product_unit_ids, 
            item.unit_details.entries, 
            baseUpdates
          );
        } else {
          logger.info('🆕 Creating new product units from entries (missing unit IDs)');
          await this.createProductUnitsFromEntries(
            item.product_id, 
            item.unit_details.entries, 
            item.unit_cost
          );
        }
      } else if (item.product_unit_ids?.length) {
        logger.info('📝 Updating product units with standard pricing (legacy structure)');
        await this.updateProductUnits(item.product_unit_ids, baseUpdates);
      } else {
        logger.info('⚠️ No unit entries or IDs found - cannot update inventory');
      }

      logger.info(`✅ Successfully synced item ${item.id} to inventory`);
    } catch (error) {
      logger.error(`❌ Failed to sync item ${item.id} to inventory:`, error);
    }
  }

  /**
   * Handle transaction item deletion
   */
  static async handleTransactionItemDeletion(deletedItem: any): Promise<void> {
    try {
      logger.info(`🔄 Handling deletion of item ${deletedItem.id}...`);

      // Reduce product stock
      await this.updateProductStock(deletedItem.product_id, deletedItem.quantity, 'subtract');

      // Update product units status if they exist
      if (deletedItem.product_unit_ids && Array.isArray(deletedItem.product_unit_ids)) {
        await this.updateProductUnits(deletedItem.product_unit_ids, {
          status: 'pending' // Revert to pending status
        });
      }

      logger.info(`✅ Successfully handled deletion of item ${deletedItem.id}`);
    } catch (error) {
      logger.error(`❌ Failed to handle deletion of item ${deletedItem.id}:`, error);
    }
  }

  /**
   * Update product stock
   */
  private static async updateProductStock(productId: string, quantity: number, operation: 'add' | 'subtract'): Promise<void> {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      logger.error(`Failed to fetch product ${productId} for stock update:`, fetchError);
      return;
    }

    const newStock = operation === 'add' ? 
      product.stock + quantity : 
      Math.max(0, product.stock - quantity);

    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        stock: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) {
      logger.error(`Failed to update stock for product ${productId}:`, updateError);
      return;
    }

    logger.info(`📦 Updated product ${productId} stock: ${product.stock} → ${newStock}`);

    // Emit stock change event
    await eventBus.emit({
      type: EVENT_TYPES.STOCK_CHANGED,
      module: 'suppliers',
      operation: 'update',
      entityId: productId,
      data: { 
        oldStock: product.stock,
        newStock: newStock,
        change: operation === 'add' ? quantity : -quantity
      }
    });
  }

  /**
   * Update product units
   */
  private static async updateProductUnits(unitIds: string[], updates: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('product_units')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', unitIds);

    if (error) {
      logger.error(`Failed to update product units ${unitIds.join(', ')}:`, error);
      return;
    }

    logger.info(`📱 Updated ${unitIds.length} product units`);

    // Emit unit status change events
    for (const unitId of unitIds) {
      await eventBus.emit({
        type: EVENT_TYPES.UNIT_STATUS_CHANGED,
        module: 'suppliers',
        operation: 'update',
        entityId: unitId,
        data: updates
      });
    }
  }

  /**
   * Update product units with individual pricing from unit entries
   * Creates missing units if they don't exist
   */
  private static async updateProductUnitsWithIndividualPricing(
    unitIds: string[], 
    unitEntries: any[], 
    baseUpdates: Record<string, any>
  ): Promise<void> {
    if (!unitIds.length || !unitEntries.length) {
      logger.warn('⚠️ No unit IDs or entries to process for individual pricing');
      return;
    }

    logger.info('💰 Updating units with individual pricing:', {
      unitIds: unitIds.length,
      entries: unitEntries.length
    });

    try {
      // First, check which units actually exist
      const { data: existingUnits, error: fetchError } = await supabase
        .from('product_units')
        .select('id, serial_number')
        .in('id', unitIds);

      if (fetchError) {
        logger.error('❌ Error fetching existing units:', fetchError);
        return;
      }

      const existingUnitIds = new Set(existingUnits?.map(u => u.id) || []);
      const existingSerials = new Set(existingUnits?.map(u => u.serial_number) || []);
      const missingUnitIds = unitIds.filter(id => !existingUnitIds.has(id));

      if (missingUnitIds.length > 0) {
        logger.warn(`⚠️ Found ${missingUnitIds.length} missing unit IDs:`, missingUnitIds);
        
        // Try to create missing units from entries
        const missingEntries = unitEntries.filter(entry => 
          entry.serial && !existingSerials.has(entry.serial)
        );
        
        if (missingEntries.length > 0) {
          logger.info('🆕 Creating missing product units from entries');
          await this.createProductUnitsFromEntries(
            baseUpdates.product_id,
            missingEntries,
            baseUpdates.purchase_price || 0
          );
        }
      }

      // Create a map of serial numbers to pricing data
      const pricingMap = new Map();
      unitEntries.forEach(entry => {
        if (entry.serial) {
          pricingMap.set(entry.serial, {
            price: entry.price || baseUpdates.purchase_price,
            min_price: entry.min_price,
            max_price: entry.max_price,
            color: entry.color,
            storage: entry.storage,
            ram: entry.ram,
            battery_level: entry.battery_level,
            condition: entry.condition || 'used'
          });
        }
      });

      // Update existing units with their specific pricing
      for (const unit of existingUnits || []) {
        try {
          const unitPricing = pricingMap.get(unit.serial_number);
          const updateData = {
            ...baseUpdates,
            ...(unitPricing || {}),
            updated_at: new Date().toISOString()
          };

          logger.info(`💰 Updating unit ${unit.id} (${unit.serial_number}) with pricing:`, unitPricing);

          const { error } = await supabase
            .from('product_units')
            .update(updateData)
            .eq('id', unit.id);

          if (error) {
            logger.error(`❌ Error updating unit ${unit.id}:`, error);
          } else {
            // Emit unit status change event
            await eventBus.emit({
              type: EVENT_TYPES.UNIT_STATUS_CHANGED,
              module: 'suppliers',
              operation: 'update',
              entityId: unit.id,
              data: updateData
            });
          }
        } catch (error) {
          logger.error(`❌ Error processing unit ${unit.id}:`, error);
        }
      }

      logger.info(`✅ Successfully processed ${existingUnits?.length || 0} existing units with individual pricing`);
    } catch (error) {
      logger.error(`Failed to update units with individual pricing:`, error);
      // Fallback to basic update
      await this.updateProductUnits(unitIds, baseUpdates);
    }
  }

  /**
   * Create product units from transaction item entries
   */
  private static async createProductUnitsFromEntries(
    productId: string, 
    entries: any[], 
    defaultPrice: number
  ): Promise<void> {
    if (!entries.length || !productId) {
      logger.info('ℹ️ No entries or product ID to create units from');
      return;
    }

    logger.info('🆕 Creating product units from entries:', {
      productId,
      entriesCount: entries.length,
      defaultPrice,
      entriesPreview: entries.slice(0, 3).map(e => ({ 
        serial: e.serial, 
        price: e.price, 
        min_price: e.min_price, 
        max_price: e.max_price 
      }))
    });

    try {
      // Filter out entries without serial numbers
      const validEntries = entries.filter(entry => entry.serial || entry.serial_number);
      
      if (validEntries.length === 0) {
        logger.warn('⚠️ No valid entries with serial numbers found');
        return;
      }

      // Check for existing units with same serial numbers to avoid duplicates
      const serials = validEntries.map(e => e.serial || e.serial_number);
      const { data: existingUnits } = await supabase
        .from('product_units')
        .select('serial_number')
        .eq('product_id', productId)
        .in('serial_number', serials);

      const existingSerials = new Set(existingUnits?.map(u => u.serial_number) || []);
      const newEntries = validEntries.filter(entry => 
        !existingSerials.has(entry.serial || entry.serial_number)
      );

      if (newEntries.length === 0) {
        logger.info('ℹ️ All units already exist, skipping creation');
        return;
      }

      const unitsToCreate = newEntries.map(entry => ({
        product_id: productId,
        serial_number: entry.serial || entry.serial_number,
        barcode: entry.barcode,
        color: entry.color,
        storage: entry.storage ? parseInt(entry.storage) : null,
        ram: entry.ram ? parseInt(entry.ram) : null,
        battery_level: entry.battery_level ? parseInt(entry.battery_level) : null,
        condition: entry.condition || 'used',
        price: entry.price || defaultPrice,
        min_price: entry.min_price,
        max_price: entry.max_price,
        purchase_price: defaultPrice,
        purchase_date: new Date().toISOString(),
        status: 'available'
      }));

      logger.info('📝 Creating units with data:', unitsToCreate.map(u => ({
        serial: u.serial_number,
        price: u.price,
        min_price: u.min_price,
        max_price: u.max_price
      })));

      // Add store_id to all units before inserting
      const unitsWithStore = await withStoreIdBatch(unitsToCreate);
      const { data: createdUnits, error } = await supabase
        .from('product_units')
        .insert(unitsWithStore)
        .select();

      if (error) {
        logger.error(`❌ Error creating product units:`, error);
      } else {
        logger.info(`✅ Created ${createdUnits?.length || 0} product units with pricing from entries`);
        
        // Emit events for each created unit
        for (const unit of createdUnits || []) {
          await eventBus.emit({
            type: EVENT_TYPES.UNIT_STATUS_CHANGED,
            module: 'suppliers',
            operation: 'create',
            entityId: unit.id,
            data: { 
              productId: productId,
              serialNumber: unit.serial_number,
              status: 'available'
            }
          });
        }
      }
    } catch (error) {
      logger.error(`❌ Failed to create product units from entries:`, error);
    }
  }

  /**
   * Get product by ID
   */
  private static async getProductById(productId: string): Promise<any> {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      logger.error(`Failed to fetch product ${productId}:`, error);
      return null;
    }

    return product;
  }

  /**
   * Manual sync for existing transactions
   */
  static async syncAllCompletedTransactions(): Promise<void> {
    try {
      logger.info('🔄 Starting manual sync of all completed transactions...');

      const { data: transactions, error } = await supabase
        .from('supplier_transactions')
        .select('id')
        .eq('status', 'completed')
        .eq('type', 'purchase');

      if (error) {
        logger.error('Failed to fetch completed transactions:', error);
        return;
      }

      logger.info(`Found ${transactions?.length || 0} completed purchase transactions to sync`);

      for (const transaction of transactions || []) {
        await this.syncTransactionToInventory(transaction.id);
      }

      logger.info('✅ Manual sync of all completed transactions finished');
    } catch (error) {
      logger.error('❌ Manual sync failed:', error);
    }
  }
}
