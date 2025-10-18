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
   * Enhanced search across transactions, items, serial numbers, and product details
   */
  static async searchWithItems(
    transactions: SupplierTransaction[],
    searchTerm: string
  ): Promise<SupplierTransaction[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return transactions;
    }

    const term = searchTerm.trim().toLowerCase();
    
    // First do basic transaction search (includes supplier name, transaction number, etc.)
    const basicResults = this.searchTransactions(transactions, searchTerm);
    const basicResultIds = new Set(basicResults.map(t => t.id));

    try {
      // Search 1: Find product units by serial number or barcode (IMEI/SN search)
      const { data: units } = await supabase
        .from('product_units')
        .select('id, serial_number, barcode')
        .or(`serial_number.ilike.%${term}%,barcode.ilike.%${term}%`);

      // Search 2: Find products by brand or model
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .or(`brand.ilike.%${term}%,model.ilike.%${term}%`);

      const matchedUnitIds = new Set(units?.map(u => u.id) || []);
      const matchedProductIds = new Set(products?.map(p => p.id) || []);

      if (matchedUnitIds.size === 0 && matchedProductIds.size === 0) {
        return basicResults;
      }

      // Find transaction items that reference these units or products
      const { data: transactionItems } = await supabase
        .from('supplier_transaction_items')
        .select('transaction_id, product_id, product_unit_ids');

      if (!transactionItems || transactionItems.length === 0) {
        return basicResults;
      }

      // Filter transaction items that match our search
      const matchedTransactionIds = new Set<string>();
      
      transactionItems.forEach(item => {
        // Check if product matches
        if (matchedProductIds.has(item.product_id)) {
          matchedTransactionIds.add(item.transaction_id);
          return;
        }

        // Check if any unit in this item matches
        if (item.product_unit_ids && Array.isArray(item.product_unit_ids)) {
          const hasMatchingUnit = item.product_unit_ids.some((unitId: string) => 
            matchedUnitIds.has(unitId)
          );
          if (hasMatchingUnit) {
            matchedTransactionIds.add(item.transaction_id);
          }
        }
      });

      // Combine results
      const itemResults = transactions.filter(t => 
        matchedTransactionIds.has(t.id) && !basicResultIds.has(t.id)
      );

      return [...basicResults, ...itemResults];
    } catch (error) {
      console.error('Error searching transaction items:', error);
      return basicResults;
    }
  }
}
