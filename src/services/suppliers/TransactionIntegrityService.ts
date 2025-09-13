import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface IntegrityCheckResult {
  valid: boolean;
  issues: Array<{
    type: 'warning' | 'error';
    message: string;
    transactionId?: string;
    data?: any;
  }>;
}

export interface TransactionConsistencyReport {
  totalTransactions: number;
  validTransactions: number;
  orphanedTransactions: number;
  zeroTotalTransactions: number;
  missingUnitsTransactions: number;
  fixes: Array<{
    type: string;
    description: string;
    affectedCount: number;
  }>;
}

export class TransactionIntegrityService {
  /**
   * Perform comprehensive integrity check on all transactions
   */
  static async checkAllTransactions(): Promise<IntegrityCheckResult> {
    const result: IntegrityCheckResult = {
      valid: true,
      issues: []
    };

    try {
      // Check for transactions with zero totals but existing units
      await this.checkZeroTotalTransactions(result);
      
      // Check for orphaned transactions (no items)
      await this.checkOrphanedTransactions(result);
      
      // Check for missing product units for serialized transactions
      await this.checkMissingUnits(result);
      
      // Check for total amount mismatches
      await this.checkTotalMismatches(result);

      result.valid = result.issues.filter(i => i.type === 'error').length === 0;

    } catch (error) {
      result.valid = false;
      result.issues.push({
        type: 'error',
        message: `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return result;
  }

  /**
   * Check for transactions with zero totals but existing units
   */
  private static async checkZeroTotalTransactions(result: IntegrityCheckResult): Promise<void> {
    const { data: transactions } = await supabase
      .from('supplier_transactions')
      .select(`
        id, 
        transaction_number, 
        total_amount,
        supplier_transaction_items (
          id,
          product_unit_ids,
          total_cost
        )
      `)
      .eq('total_amount', 0);

    transactions?.forEach(transaction => {
      const items = transaction.supplier_transaction_items || [];
      const hasUnits = items.some(item => {
        const unitIds = item.product_unit_ids as any;
        return unitIds && Array.isArray(unitIds) && unitIds.length > 0;
      });

      if (hasUnits) {
        result.issues.push({
          type: 'error',
          message: `Transaction ${transaction.transaction_number} has zero total but contains product units`,
          transactionId: transaction.id,
          data: { itemsWithUnits: items.filter(i => i.product_unit_ids?.length > 0).length }
        });
      }
    });
  }

  /**
   * Check for orphaned transactions (no items)
   */
  private static async checkOrphanedTransactions(result: IntegrityCheckResult): Promise<void> {
    const { data: orphanedTransactions } = await supabase
      .from('supplier_transactions')
      .select(`
        id,
        transaction_number,
        total_amount,
        supplier_transaction_items (id)
      `)
      .eq('supplier_transaction_items.id', null);

    orphanedTransactions?.forEach(transaction => {
      result.issues.push({
        type: 'warning',
        message: `Transaction ${transaction.transaction_number} has no items`,
        transactionId: transaction.id,
        data: { totalAmount: transaction.total_amount }
      });
    });
  }

  /**
   * Check for missing product units for serialized transactions
   */
  private static async checkMissingUnits(result: IntegrityCheckResult): Promise<void> {
    const { data: itemsWithUnits } = await supabase
      .from('supplier_transaction_items')
      .select(`
        id,
        transaction_id,
        product_id,
        quantity,
        product_unit_ids,
        supplier_transactions (transaction_number),
        products (has_serial, brand, model)
      `)
      .not('product_unit_ids', 'is', null);

    itemsWithUnits?.forEach(item => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      const transaction = Array.isArray(item.supplier_transactions) 
        ? item.supplier_transactions[0] 
        : item.supplier_transactions;

      if (product?.has_serial) {
        const unitIds = item.product_unit_ids as any;
        const unitIdsArray = Array.isArray(unitIds) ? unitIds : [];
        
        if (unitIdsArray.length === 0) {
          result.issues.push({
            type: 'error',
            message: `Serialized product ${product.brand} ${product.model} in transaction ${transaction?.transaction_number} has no associated units`,
            transactionId: item.transaction_id,
            data: { 
              productId: item.product_id,
              expectedQuantity: item.quantity
            }
          });
        } else if (unitIds.length !== item.quantity) {
          result.issues.push({
            type: 'warning',
            message: `Product ${product.brand} ${product.model} unit count (${unitIds.length}) doesn't match quantity (${item.quantity})`,
            transactionId: item.transaction_id,
            data: {
              productId: item.product_id,
              expectedQuantity: item.quantity,
              actualUnits: unitIdsArray.length
            }
          });
        }
      }
    });
  }

  /**
   * Check for total amount mismatches between transactions and items
   */
  private static async checkTotalMismatches(result: IntegrityCheckResult): Promise<void> {
    const { data: transactions } = await supabase
      .from('supplier_transactions')
      .select(`
        id,
        transaction_number,
        total_amount,
        supplier_transaction_items (
          total_cost
        )
      `);

    transactions?.forEach(transaction => {
      const items = transaction.supplier_transaction_items || [];
      const calculatedTotal = items.reduce((sum, item) => sum + (item.total_cost || 0), 0);
      const difference = Math.abs(calculatedTotal - transaction.total_amount);

      if (difference > 0.01) { // Allow for small rounding differences
        result.issues.push({
          type: 'error',
          message: `Transaction ${transaction.transaction_number} total mismatch: recorded ${transaction.total_amount}, calculated ${calculatedTotal}`,
          transactionId: transaction.id,
          data: {
            recordedTotal: transaction.total_amount,
            calculatedTotal,
            difference
          }
        });
      }
    });
  }

  /**
   * Fix common transaction integrity issues
   */
  static async fixTransactionIssues(): Promise<TransactionConsistencyReport> {
    const report: TransactionConsistencyReport = {
      totalTransactions: 0,
      validTransactions: 0,
      orphanedTransactions: 0,
      zeroTotalTransactions: 0,
      missingUnitsTransactions: 0,
      fixes: []
    };

    try {
      // Get total transaction count
      const { count: totalCount } = await supabase
        .from('supplier_transactions')
        .select('*', { count: 'exact', head: true });
      
      report.totalTransactions = totalCount || 0;

      // Fix zero total transactions by recalculating from items
      const zeroTotalFixed = await this.fixZeroTotalTransactions();
      report.fixes.push({
        type: 'zero_total_recalculation',
        description: 'Recalculated transaction totals from item costs',
        affectedCount: zeroTotalFixed
      });

      // Clean up orphaned transactions
      const orphanedCleaned = await this.cleanupOrphanedTransactions();
      report.orphanedTransactions = orphanedCleaned;
      report.fixes.push({
        type: 'orphaned_cleanup',
        description: 'Removed transactions with no items',
        affectedCount: orphanedCleaned
      });

      // Validate remaining transactions
      const integrityCheck = await this.checkAllTransactions();
      report.validTransactions = report.totalTransactions - integrityCheck.issues.filter(i => i.type === 'error').length;

      logger.info('✅ Transaction integrity fixes completed', report);

    } catch (error) {
      logger.error('❌ Failed to fix transaction issues', { error });
      throw error;
    }

    return report;
  }

  /**
   * Fix transactions with zero totals by recalculating from items
   */
  private static async fixZeroTotalTransactions(): Promise<number> {
    let fixedCount = 0;

    const { data: zeroTotalTransactions } = await supabase
      .from('supplier_transactions')
      .select(`
        id,
        supplier_transaction_items (
          total_cost
        )
      `)
      .eq('total_amount', 0);

    for (const transaction of zeroTotalTransactions || []) {
      const items = transaction.supplier_transaction_items || [];
      const calculatedTotal = items.reduce((sum, item) => sum + (item.total_cost || 0), 0);

      if (calculatedTotal > 0) {
        const { error } = await supabase
          .from('supplier_transactions')
          .update({ total_amount: calculatedTotal })
          .eq('id', transaction.id);

        if (!error) {
          fixedCount++;
          logger.info(`Fixed transaction ${transaction.id} total: ${calculatedTotal}`);
        }
      }
    }

    return fixedCount;
  }

  /**
   * Clean up orphaned transactions (those with no items)
   */
  private static async cleanupOrphanedTransactions(): Promise<number> {
    // First, get orphaned transaction IDs
    const { data: orphanedTransactions } = await supabase
      .from('supplier_transactions')
      .select('id')
      .not('id', 'in', 
        supabase
          .from('supplier_transaction_items')
          .select('transaction_id')
      );

    if (!orphanedTransactions || orphanedTransactions.length === 0) {
      return 0;
    }

    const orphanedIds = orphanedTransactions.map(t => t.id);

    // Delete orphaned transactions
    const { error } = await supabase
      .from('supplier_transactions')
      .delete()
      .in('id', orphanedIds);

    if (error) {
      throw new Error(`Failed to cleanup orphaned transactions: ${error.message}`);
    }

    logger.info(`Cleaned up ${orphanedIds.length} orphaned transactions`);
    return orphanedIds.length;
  }

  /**
   * Generate a detailed consistency report without making changes
   */
  static async generateConsistencyReport(): Promise<TransactionConsistencyReport> {
    const report: TransactionConsistencyReport = {
      totalTransactions: 0,
      validTransactions: 0,
      orphanedTransactions: 0,
      zeroTotalTransactions: 0,
      missingUnitsTransactions: 0,
      fixes: []
    };

    // Get total counts
    const { count: totalCount } = await supabase
      .from('supplier_transactions')
      .select('*', { count: 'exact', head: true });
    
    report.totalTransactions = totalCount || 0;

    // Count zero total transactions
    const { count: zeroTotalCount } = await supabase
      .from('supplier_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('total_amount', 0);
    
    report.zeroTotalTransactions = zeroTotalCount || 0;

    // Run integrity check
    const integrityCheck = await this.checkAllTransactions();
    report.validTransactions = report.totalTransactions - integrityCheck.issues.filter(i => i.type === 'error').length;

    return report;
  }
}