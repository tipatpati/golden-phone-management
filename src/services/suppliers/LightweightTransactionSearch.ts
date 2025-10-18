import { supabase } from '@/integrations/supabase/client';
import type { SupplierTransaction } from './types';

/**
 * Lightweight client-side search for supplier transactions
 * Optimized for performance - searches in-memory after initial data fetch
 */
export class LightweightTransactionSearch {
  /**
   * Search transactions by transaction number, supplier name, notes, or status
   */
  static searchTransactions(
    transactions: SupplierTransaction[],
    searchTerm: string
  ): SupplierTransaction[] {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return transactions;
    }

    const term = searchTerm.trim().toLowerCase();

    return transactions.filter(transaction => {
      // Search by transaction number
      if (transaction.transaction_number?.toLowerCase().includes(term)) {
        return true;
      }

      // Search by supplier name (if available)
      if (transaction.suppliers?.name?.toLowerCase().includes(term)) {
        return true;
      }

      // Search by notes
      if (transaction.notes?.toLowerCase().includes(term)) {
        return true;
      }

      // Search by status
      if (transaction.status?.toLowerCase().includes(term)) {
        return true;
      }

      // Search by type
      if (transaction.type?.toLowerCase().includes(term)) {
        return true;
      }

      return false;
    });
  }

  /**
   * Search across transactions and their items for serial numbers or product details
   * This requires fetching transaction items
   */
  static async searchWithItems(
    transactions: SupplierTransaction[],
    searchTerm: string
  ): Promise<SupplierTransaction[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return transactions;
    }

    const term = searchTerm.trim().toLowerCase();
    
    // First do basic transaction search
    const basicResults = this.searchTransactions(transactions, searchTerm);
    
    // Check if search term looks like a serial/barcode
    const isSerialLike = /^[a-zA-Z0-9-]+$/.test(term);
    
    if (!isSerialLike) {
      return basicResults;
    }

    // Search for serial numbers in product units
    const { data: units } = await supabase
      .from('product_units')
      .select(`
        id,
        serial_number,
        barcode,
        supplier_id,
        products (
          brand,
          model
        )
      `)
      .or(`serial_number.ilike.%${term}%,barcode.ilike.%${term}%`);

    if (!units || units.length === 0) {
      return basicResults;
    }

    // Find transactions that contain these units
    const unitIds = units.map(u => u.id);
    const { data: transactionItems } = await supabase
      .from('supplier_transaction_items')
      .select('transaction_id')
      .or(unitIds.map(id => `product_unit_ids.cs.{${id}}`).join(','));

    if (!transactionItems || transactionItems.length === 0) {
      return basicResults;
    }

    const transactionIds = new Set(transactionItems.map(item => item.transaction_id));
    const itemResults = transactions.filter(t => transactionIds.has(t.id));

    // Combine and deduplicate results
    const allResults = [...basicResults];
    itemResults.forEach(result => {
      if (!allResults.find(r => r.id === result.id)) {
        allResults.push(result);
      }
    });

    return allResults;
  }
}
