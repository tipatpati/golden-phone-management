/**
 * Exchange Inventory Reconciliation Service
 * Ensures perfect synchronization between exchange trade-ins and inventory
 */

import { supabase } from '@/integrations/supabase/client';

export interface ReconciliationResult {
  success: boolean;
  missingInInventory: Array<{
    tradeInItemId: string;
    productId: string;
    serialNumber: string;
    exchangeNumber: string;
  }>;
  extraInInventory: Array<{
    unitId: string;
    productId: string;
    serialNumber: string;
  }>;
  fixedCount: number;
}

export class ExchangeInventoryReconciliation {
  /**
   * Compare exchange trade-in records with actual inventory
   */
  static async reconcile(): Promise<ReconciliationResult> {
    console.log('🔄 [Exchange Reconciliation] Starting reconciliation...');

    try {
      // Find trade-in items that should be in inventory but aren't
      const { data: missingItems, error: missingError } = await supabase
        .from('exchange_trade_in_items')
        .select(`
          id,
          product_id,
          serial_number,
          exchange_transactions!inner(exchange_number, status)
        `)
        .eq('exchange_transactions.status', 'completed')
        .not('product_id', 'is', null);

      if (missingError) throw missingError;

      const missingInInventory: ReconciliationResult['missingInInventory'] = [];

      // Check each trade-in item
      for (const item of missingItems || []) {
        const { data: unit } = await supabase
          .from('product_units')
          .select('id')
          .eq('product_id', item.product_id)
          .eq('serial_number', item.serial_number)
          .maybeSingle();

        if (!unit) {
          missingInInventory.push({
            tradeInItemId: item.id,
            productId: item.product_id,
            serialNumber: item.serial_number,
            exchangeNumber: (item.exchange_transactions as any).exchange_number
          });
        }
      }

      console.log(`📊 [Exchange Reconciliation] Found ${missingInInventory.length} missing items`);

      return {
        success: true,
        missingInInventory,
        extraInInventory: [],
        fixedCount: 0
      };

    } catch (error: any) {
      console.error('❌ [Exchange Reconciliation] Failed:', error);
      return {
        success: false,
        missingInInventory: [],
        extraInInventory: [],
        fixedCount: 0
      };
    }
  }

  /**
   * Auto-fix discrepancies between exchanges and inventory
   */
  static async autoFix(): Promise<{ fixedCount: number; errors: string[] }> {
    console.log('🔧 [Exchange Reconciliation] Starting auto-fix...');

    const reconciliation = await this.reconcile();
    let fixedCount = 0;
    const errors: string[] = [];

    // Fix missing inventory items
    for (const missing of reconciliation.missingInInventory) {
      try {
        console.log(`🔧 [Exchange Reconciliation] Creating missing unit: ${missing.serialNumber}`);

        // Get store_id from the first available source
        const { data: storeData } = await supabase
          .from('products')
          .select('store_id')
          .eq('id', missing.productId)
          .single();

        if (!storeData?.store_id) {
          errors.push(`Failed to find store for product ${missing.productId}`);
          continue;
        }

        const { error } = await supabase
          .from('product_units')
          .insert([{
            product_id: missing.productId,
            serial_number: missing.serialNumber,
            store_id: storeData.store_id,
            status: 'available',
            condition: 'good'
          }]);

        if (error) {
          errors.push(`Failed to create unit ${missing.serialNumber}: ${error.message}`);
        } else {
          fixedCount++;
        }
      } catch (error: any) {
        errors.push(`Error fixing ${missing.serialNumber}: ${error.message}`);
      }
    }

    console.log(`✅ [Exchange Reconciliation] Fixed ${fixedCount} issues`);

    return { fixedCount, errors };
  }
}
