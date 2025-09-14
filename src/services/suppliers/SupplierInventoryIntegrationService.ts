import { supabase } from '@/integrations/supabase/client';
import { eventBus, EVENT_TYPES } from '@/services/core/EventBus';
import { logger } from '@/utils/logger';

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
      logger.info(`🔄 Syncing item ${item.id} to inventory...`);

      const product = item.products || await this.getProductById(item.product_id);
      if (!product) {
        logger.error(`Product ${item.product_id} not found for sync`);
        return;
      }

      // Update product stock for purchase transactions
      await this.updateProductStock(item.product_id, item.quantity, 'add');

      // Update product units if they exist
      if (item.product_unit_ids && Array.isArray(item.product_unit_ids)) {
        await this.updateProductUnits(item.product_unit_ids, {
          purchase_price: item.unit_cost,
          status: 'available'
        });
      }

      // Create new product units if needed for serialized products
      if (product.has_serial && item.unit_details?.entries) {
        await this.createProductUnitsFromEntries(item.product_id, item.unit_details.entries, item.unit_cost);
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
   * Create product units from transaction item entries
   */
  private static async createProductUnitsFromEntries(
    productId: string, 
    entries: any[], 
    defaultPrice: number
  ): Promise<void> {
    try {
      const unitsToCreate = entries.map(entry => ({
        product_id: productId,
        serial_number: entry.serial,
        color: entry.color,
        storage: entry.storage,
        ram: entry.ram,
        battery_level: entry.battery_level,
        price: entry.price || defaultPrice,
        min_price: entry.min_price || 0,
        max_price: entry.max_price || 0,
        purchase_price: entry.price || defaultPrice,
        status: 'available'
      }));

      const { data: createdUnits, error } = await supabase
        .from('product_units')
        .insert(unitsToCreate)
        .select();

      if (error) {
        logger.error(`Failed to create product units for product ${productId}:`, error);
        return;
      }

      logger.info(`📱 Created ${createdUnits?.length || 0} new product units for product ${productId}`);

      // Emit unit creation events
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
    } catch (error) {
      logger.error(`Failed to create product units from entries:`, error);
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
