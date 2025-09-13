import { eventBus, EVENT_TYPES } from '@/services/core/EventBus';
import { dataOrchestrator } from '@/services/core/DataOrchestrator';
import { ProductUnitManagementService } from '@/services/shared/ProductUnitManagementService';
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/utils/logger';
import type { 
  EditableTransactionItem,
  SupplierTransaction,
  UpdateTransactionData
} from './types';
import type { UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';

/**
 * Centralized service for transaction editing operations
 * Handles business logic, validation, and cross-module coordination
 */
export class TransactionEditingService {
  private static instance: TransactionEditingService;

  private constructor() {}

  static getInstance(): TransactionEditingService {
    if (!TransactionEditingService.instance) {
      TransactionEditingService.instance = new TransactionEditingService();
    }
    return TransactionEditingService.instance;
  }

  /**
   * Validate transaction data before editing
   */
  async validateTransactionEdit(
    transaction: SupplierTransaction,
    updates: UpdateTransactionData,
    items: EditableTransactionItem[]
  ): Promise<void> {
    // Validate basic transaction data
    if (updates.transaction_date && new Date(updates.transaction_date) > new Date()) {
      throw new Error('Transaction date cannot be in the future');
    }

    // Validate items
    if (items.length === 0) {
      throw new Error('Transaction must have at least one item');
    }

    for (const item of items) {
      if (!item.product_id) {
        throw new Error('All items must have a product selected');
      }
      
      if (item.quantity <= 0) {
        throw new Error('Item quantity must be greater than zero');
      }
      
      if (item.unit_cost < 0) {
        throw new Error('Item unit cost cannot be negative');
      }
    }

    // Validate serialized product constraints
    await this.validateSerializedProductItems(items);
  }

  /**
   * Validate serialized product items have proper unit assignments
   */
  private async validateSerializedProductItems(items: EditableTransactionItem[]): Promise<void> {
    for (const item of items) {
      // Check if product requires serial numbers
      const { data: product, error } = await supabase
        .from('products')
        .select('has_serial, brand, model')
        .eq('id', item.product_id)
        .single();

      if (error) {
        throw new Error(`Failed to validate product: ${error.message}`);
      }

      if (product.has_serial) {
        if (!item.product_unit_ids?.length) {
          throw new Error(`Product ${product.brand} ${product.model} requires specific unit assignment`);
        }
        
        if (item.product_unit_ids.length !== item.quantity) {
          throw new Error(`Product ${product.brand} ${product.model}: unit count must match quantity`);
        }
      }
    }
  }

  /**
   * Calculate accurate pricing for transaction items
   */
  async calculateTransactionPricing(
    items: EditableTransactionItem[],
    unitEntries: Record<number, UnitEntryFormType[]>
  ): Promise<{
    itemTotals: number[];
    grandTotal: number;
    adjustedItems: EditableTransactionItem[];
  }> {
    const itemTotals: number[] = [];
    const adjustedItems: EditableTransactionItem[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Check if product uses serial numbers
      const { data: product } = await supabase
        .from('products')
        .select('has_serial')
        .eq('id', item.product_id)
        .single();

      let itemTotal = 0;
      let adjustedItem = { ...item };

      if (product?.has_serial && unitEntries[i]?.length) {
        // Use individual unit prices for serialized products
        itemTotal = unitEntries[i].reduce((sum, entry) => sum + (entry.price || 0), 0);
        
        // Adjust unit cost to reflect average price
        adjustedItem.unit_cost = itemTotal / item.quantity;
      } else {
        // Use quantity * unit_cost for non-serialized products
        itemTotal = item.quantity * item.unit_cost;
      }

      itemTotals.push(itemTotal);
      adjustedItems.push(adjustedItem);
    }

    const grandTotal = itemTotals.reduce((sum, total) => sum + total, 0);

    return {
      itemTotals,
      grandTotal,
      adjustedItems
    };
  }

  /**
   * Execute transaction update with full coordination
   */
  async updateTransactionWithCoordination(
    transactionId: string,
    updates: UpdateTransactionData,
    items: EditableTransactionItem[],
    unitEntries: Record<number, UnitEntryFormType[]>
  ): Promise<void> {
    const correlationId = `tx_edit_${transactionId}_${Date.now()}`;
    
    logger.info('TransactionEditingService: Starting coordinated update', {
      transactionId,
      correlationId,
      itemCount: items.length
    });

    try {
      // Get original transaction for validation
      const { data: originalTransaction, error: fetchError } = await supabase
        .from('supplier_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError || !originalTransaction) {
        throw new Error('Transaction not found');
      }

      // Cast to proper type
      const transaction = originalTransaction as SupplierTransaction;

      // Validate the edit operation
      await this.validateTransactionEdit(transaction, updates, items);

      // Calculate accurate pricing
      const { grandTotal, adjustedItems } = await this.calculateTransactionPricing(items, unitEntries);

      // Update transaction with calculated total
      const finalUpdates = {
        ...updates,
        total_amount: grandTotal
      };

      // Execute through data orchestrator for coordination
      await dataOrchestrator.executeOperation(
        'supplier_transaction.update',
        async () => {
          // Update transaction details
          const { error: updateError } = await supabase
            .from('supplier_transactions')
            .update(finalUpdates)
            .eq('id', transactionId);

          if (updateError) throw updateError;

          // Replace transaction items
          await this.replaceTransactionItemsCoordinated(transactionId, adjustedItems, correlationId);

          // Update product unit pricing if needed
          await this.updateProductUnitPricing(adjustedItems, unitEntries);

          return true;
        },
        { 
          transactionId, 
          updates: finalUpdates, 
          items: adjustedItems,
          correlationId 
        }
      );

      // Emit completion event
      await eventBus.emit({
        type: EVENT_TYPES.SUPPLIER_TRANSACTION_UPDATED,
        module: 'suppliers',
        operation: 'update',
        entityId: transactionId,
        data: { 
          updates: finalUpdates, 
          itemCount: adjustedItems.length,
          totalAmount: grandTotal
        },
        metadata: { correlationId, timestamp: Date.now() }
      });

      logger.info('TransactionEditingService: Update completed successfully', {
        transactionId,
        correlationId
      });

    } catch (error) {
      logger.error('TransactionEditingService: Update failed', {
        transactionId,
        correlationId,
        error
      });

      // Emit error event
      await eventBus.emit({
        type: EVENT_TYPES.SYSTEM_ERROR,
        module: 'suppliers',
        operation: 'update',
        entityId: transactionId,
        data: { error, correlationId },
        metadata: { correlationId, timestamp: Date.now() }
      });

      throw error;
    }
  }

  /**
   * Replace transaction items with proper coordination
   */
  private async replaceTransactionItemsCoordinated(
    transactionId: string,
    items: EditableTransactionItem[],
    correlationId: string
  ): Promise<void> {
    // Delete existing items
    const { error: deleteError } = await supabase
      .from('supplier_transaction_items')
      .delete()
      .eq('transaction_id', transactionId);

    if (deleteError) throw deleteError;

    // Insert new items if any
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        transaction_id: transactionId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost,
        unit_details: {
          ...(item.unit_barcodes?.length ? { barcodes: item.unit_barcodes } : {}),
          ...(item.product_unit_ids?.length ? { product_unit_ids: item.product_unit_ids } : {})
        },
        product_unit_ids: item.product_unit_ids || null,
      }));

      const { error: insertError } = await supabase
        .from('supplier_transaction_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;
    }

    // Emit item replacement event
    await eventBus.emit({
      type: EVENT_TYPES.SUPPLIER_TRANSACTION_ITEMS_REPLACED,
      module: 'suppliers',
      operation: 'update',
      entityId: transactionId,
      data: { 
        itemCount: items.length,
        affectedProducts: [...new Set(items.map(item => item.product_id))]
      },
      metadata: { correlationId, timestamp: Date.now() }
    });
  }

  /**
   * Update product unit pricing based on transaction
   */
  private async updateProductUnitPricing(
    items: EditableTransactionItem[],
    unitEntries: Record<number, UnitEntryFormType[]>
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.product_unit_ids?.length && unitEntries[i]?.length) {
        // Update individual unit purchase prices
        for (let j = 0; j < item.product_unit_ids.length; j++) {
          const unitId = item.product_unit_ids[j];
          const unitEntry = unitEntries[i][j];
          
          if (unitEntry?.price) {
            try {
              await ProductUnitManagementService.updateUnitPurchasePrice(unitId, unitEntry.price);
            } catch (error) {
              logger.error('Failed to update unit purchase price', { unitId, price: unitEntry.price, error });
            }
          }
        }
      }
    }
  }

  /**
   * Rollback transaction changes if needed
   */
  async rollbackTransaction(transactionId: string, backupData: any): Promise<void> {
    logger.warn('TransactionEditingService: Rolling back transaction', { transactionId });
    
    try {
      // Restore original transaction data
      if (backupData.transaction) {
        const { error: restoreError } = await supabase
          .from('supplier_transactions')
          .update(backupData.transaction)
          .eq('id', transactionId);

        if (restoreError) throw restoreError;
      }

      // Restore original items
      if (backupData.items) {
        await this.replaceTransactionItemsCoordinated(
          transactionId, 
          backupData.items, 
          `rollback_${Date.now()}`
        );
      }

      logger.info('TransactionEditingService: Rollback completed', { transactionId });

    } catch (error) {
      logger.error('TransactionEditingService: Rollback failed', { transactionId, error });
      throw new Error(`Rollback failed: ${error}`);
    }
  }
}

// Export singleton instance
export const transactionEditingService = TransactionEditingService.getInstance();