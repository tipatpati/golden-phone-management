import { supabase } from '@/integrations/supabase/client';
import type { SupplierTransaction } from './types';

/**
 * Enhanced unit data for search
 */
interface EnrichedUnit {
  id: string;
  serial_number: string | null;
  barcode: string | null;
  product_id: string;
}

/**
 * Lightweight client-side search for supplier transactions
 * Optimized for performance - searches in-memory after initial data fetch
 */
export class LightweightTransactionSearch {
  private static unitCache = new Map<string, EnrichedUnit>();

  /**
   * Enrich transactions with product unit data (serial numbers, barcodes)
   * Fetches all required units in a single query and caches results
   */
  static async enrichTransactionsWithUnits(
    transactions: SupplierTransaction[]
  ): Promise<SupplierTransaction[]> {
    // Collect all unique unit IDs from all transaction items
    const allUnitIds = new Set<string>();
    
    transactions.forEach(transaction => {
      const items = (transaction as any).items || [];
      items.forEach((item: any) => {
        if (item.product_unit_ids && Array.isArray(item.product_unit_ids)) {
          item.product_unit_ids.forEach((id: string) => allUnitIds.add(id));
        }
      });
    });

    // If no units to fetch, return transactions as-is
    if (allUnitIds.size === 0) {
      return transactions;
    }

    // Filter out already cached units
    const uncachedUnitIds = Array.from(allUnitIds).filter(id => !this.unitCache.has(id));

    // Fetch uncached units in a single query
    if (uncachedUnitIds.length > 0) {
      try {
        const { data: units } = await supabase
          .from('product_units')
          .select('id, serial_number, barcode, product_id')
          .in('id', uncachedUnitIds);

        // Add to cache
        units?.forEach(unit => {
          this.unitCache.set(unit.id, unit as EnrichedUnit);
        });
      } catch (error) {
        console.error('Error fetching product units for search:', error);
      }
    }

    // Enrich transactions with unit data
    return transactions.map(transaction => {
      const items = (transaction as any).items || [];
      const enrichedItems = items.map((item: any) => ({
        ...item,
        _enrichedUnits: (item.product_unit_ids || [])
          .map((id: string) => this.unitCache.get(id))
          .filter(Boolean)
      }));

      return {
        ...transaction,
        items: enrichedItems
      } as SupplierTransaction;
    });
  }

  /**
   * Search transactions with prioritized matching
   * Searches across transaction fields, supplier name, product details, and serial numbers
   */
  static searchTransactions(
    transactions: SupplierTransaction[],
    searchTerm: string
  ): SupplierTransaction[] {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return transactions;
    }

    const term = searchTerm.trim().toLowerCase();
    
    // Priority buckets for results
    const exactMatches: SupplierTransaction[] = [];
    const highPriorityMatches: SupplierTransaction[] = [];
    const mediumPriorityMatches: SupplierTransaction[] = [];
    const lowPriorityMatches: SupplierTransaction[] = [];

    transactions.forEach(transaction => {
      let matched = false;
      let priority = 0;

      // HIGHEST PRIORITY: Exact IMEI/SN matches
      const items = (transaction as any).items || [];
      const hasExactSerialMatch = items.some((item: any) => 
        item._enrichedUnits?.some((unit: EnrichedUnit) => 
          unit.serial_number?.toLowerCase() === term ||
          unit.barcode?.toLowerCase() === term
        )
      );

      if (hasExactSerialMatch) {
        exactMatches.push(transaction);
        return;
      }

      // HIGH PRIORITY: Transaction number, Supplier name
      if (transaction.transaction_number?.toLowerCase().includes(term)) {
        matched = true;
        priority = Math.max(priority, 3);
      }

      if (transaction.suppliers?.name?.toLowerCase().includes(term)) {
        matched = true;
        priority = Math.max(priority, 3);
      }

      // MEDIUM PRIORITY: Product brand/model, Partial serial/barcode match
      const hasProductMatch = items.some((item: any) => 
        item.products?.brand?.toLowerCase().includes(term) ||
        item.products?.model?.toLowerCase().includes(term)
      );

      if (hasProductMatch) {
        matched = true;
        priority = Math.max(priority, 2);
      }

      const hasPartialSerialMatch = items.some((item: any) => 
        item._enrichedUnits?.some((unit: EnrichedUnit) => 
          unit.serial_number?.toLowerCase().includes(term) ||
          unit.barcode?.toLowerCase().includes(term)
        )
      );

      if (hasPartialSerialMatch) {
        matched = true;
        priority = Math.max(priority, 2);
      }

      // LOW PRIORITY: Status, Type, Notes
      if (transaction.status?.toLowerCase().includes(term)) {
        matched = true;
        priority = Math.max(priority, 1);
      }

      if (transaction.type?.toLowerCase().includes(term)) {
        matched = true;
        priority = Math.max(priority, 1);
      }

      if (transaction.notes?.toLowerCase().includes(term)) {
        matched = true;
        priority = Math.max(priority, 1);
      }

      // Add to appropriate priority bucket
      if (matched) {
        if (priority === 3) {
          highPriorityMatches.push(transaction);
        } else if (priority === 2) {
          mediumPriorityMatches.push(transaction);
        } else {
          lowPriorityMatches.push(transaction);
        }
      }
    });

    // Return results in priority order
    return [
      ...exactMatches,
      ...highPriorityMatches,
      ...mediumPriorityMatches,
      ...lowPriorityMatches
    ];
  }

  /**
   * Clear the unit cache (useful when units are updated)
   */
  static clearCache() {
    this.unitCache.clear();
  }
}
