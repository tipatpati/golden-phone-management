import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { eventBus, EVENT_TYPES } from '@/services/core/EventBus';
import { UnifiedProductCoordinator } from "@/services/shared/UnifiedProductCoordinator";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import type { 
  SupplierTransaction, 
  SupplierTransactionItem,
  CreateTransactionData,
  CreateTransactionItemData,
  UpdateTransactionData,
  EditableTransactionItem,
  TransactionSearchFilters,
  TransactionSummary
} from './types';

// ============= QUERY KEYS =============
export const SUPPLIER_TRANSACTION_KEYS = {
  all: ['supplier-transactions'] as const,
  lists: () => [...SUPPLIER_TRANSACTION_KEYS.all, 'list'] as const,
  list: (filters: TransactionSearchFilters) => [...SUPPLIER_TRANSACTION_KEYS.lists(), filters] as const,
  details: () => [...SUPPLIER_TRANSACTION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...SUPPLIER_TRANSACTION_KEYS.details(), id] as const,
  items: (transactionId: string) => [...SUPPLIER_TRANSACTION_KEYS.all, 'items', transactionId] as const,
  summary: () => [...SUPPLIER_TRANSACTION_KEYS.all, 'summary'] as const,
};

// ============= API FUNCTIONS =============
export const supplierTransactionApi = {
  async getAll(filters: TransactionSearchFilters = {}): Promise<SupplierTransaction[]> {
    let query = (supabase as any)
      .from("supplier_transactions")
      .select(`
        *,
        suppliers (
          id,
          name
        ),
        items:supplier_transaction_items (
          *,
          products (
            id,
            brand,
            model,
            has_serial
          )
        )
      `)
      .order("created_at", { ascending: false });

    // Apply filters (NOT search - that's client-side)
    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters.dateFrom) {
      query = query.gte('transaction_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('transaction_date', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data as SupplierTransaction[];
  },

  /**
   * Enrich transactions with product unit details (serial numbers, barcodes)
   */
  async enrichTransactionUnits(transactions: SupplierTransaction[]): Promise<SupplierTransaction[]> {
    // Collect all unit IDs across all transactions
    const allUnitIds = transactions.flatMap(t => 
      t.items?.flatMap(item => 
        Array.isArray(item.product_unit_ids) ? item.product_unit_ids : []
      ) || []
    );

    if (allUnitIds.length === 0) {
      return transactions;
    }

    // Deduplicate unit IDs
    const uniqueUnitIds = [...new Set(allUnitIds)];

    // Single query for all units
    const { data: units, error } = await supabase
      .from('product_units')
      .select('id, serial_number, barcode, product_id')
      .in('id', uniqueUnitIds);

    if (error) {
      console.error('Error fetching units for enrichment:', error);
      return transactions;
    }

    // Create lookup map
    const unitsMap = new Map(units?.map(u => [u.id, u]) || []);

    // Enrich transactions with unit data
    return transactions.map(transaction => ({
      ...transaction,
      items: transaction.items?.map(item => ({
        ...item,
        _enrichedUnits: Array.isArray(item.product_unit_ids)
          ? item.product_unit_ids
              .map(id => unitsMap.get(id))
              .filter(Boolean)
          : []
      })) || []
    }));
  },

  /**
   * Client-side search filtering with prioritized results
   */
  searchTransactions(
    transactions: SupplierTransaction[], 
    searchTerm: string
  ): SupplierTransaction[] {
    if (!searchTerm || !searchTerm.trim()) {
      return transactions;
    }

    const term = searchTerm.trim().toLowerCase();
    
    const exactUnitMatches: SupplierTransaction[] = [];
    const highPriorityMatches: SupplierTransaction[] = [];
    const mediumPriorityMatches: SupplierTransaction[] = [];
    const lowPriorityMatches: SupplierTransaction[] = [];

    transactions.forEach(transaction => {
      let matched = false;
      
      // Priority 1: Exact IMEI/SN or barcode match
      const hasExactUnit = transaction.items?.some(item =>
        item._enrichedUnits?.some((unit: any) =>
          unit.serial_number?.toLowerCase() === term || 
          unit.barcode?.toLowerCase() === term
        )
      );
      
      if (hasExactUnit) {
        exactUnitMatches.push(transaction);
        matched = true;
      }
      
      if (!matched) {
        // Priority 2: Supplier name or transaction number
        const hasHighPriorityMatch = 
          transaction.suppliers?.name?.toLowerCase().includes(term) ||
          transaction.transaction_number?.toLowerCase().includes(term);
        
        if (hasHighPriorityMatch) {
          highPriorityMatches.push(transaction);
          matched = true;
        }
      }
      
      if (!matched) {
        // Priority 3: Product brand/model or partial unit matches
        const hasMediumPriorityMatch = transaction.items?.some(item =>
          item.products?.brand?.toLowerCase().includes(term) ||
          item.products?.model?.toLowerCase().includes(term) ||
          item._enrichedUnits?.some((unit: any) =>
            unit.serial_number?.toLowerCase().includes(term) ||
            unit.barcode?.toLowerCase().includes(term)
          )
        );
        
        if (hasMediumPriorityMatch) {
          mediumPriorityMatches.push(transaction);
          matched = true;
        }
      }
      
      if (!matched) {
        // Priority 4: Notes, status, or type
        const hasLowPriorityMatch =
          transaction.notes?.toLowerCase().includes(term) ||
          transaction.status?.toLowerCase().includes(term) ||
          transaction.type?.toLowerCase().includes(term);
        
        if (hasLowPriorityMatch) {
          lowPriorityMatches.push(transaction);
        }
      }
    });

    const results = [
      ...exactUnitMatches,
      ...highPriorityMatches,
      ...mediumPriorityMatches,
      ...lowPriorityMatches
    ];

    console.log('🔍 Supplier Transaction Search:', {
      searchTerm: term,
      totalMatches: results.length,
      exactUnitMatches: exactUnitMatches.length,
      highPriorityMatches: highPriorityMatches.length,
      mediumPriorityMatches: mediumPriorityMatches.length,
      lowPriorityMatches: lowPriorityMatches.length,
    });

    return results;
  },

  async getById(id: string): Promise<SupplierTransaction | null> {
    const { data, error } = await (supabase as any)
      .from("supplier_transactions")
      .select(`
        *,
        suppliers (
          name
        )
      `)
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching transaction by ID:', error);
      throw error;
    }
    
    return data as SupplierTransaction | null;
  },

  async create(transactionData: CreateTransactionData): Promise<SupplierTransaction> {
    // Calculate actual total using individual unit prices for serialized products
    const actualTotal = await this.calculateTransactionTotal(transactionData.items);
    
    // Start transaction - transaction_number is auto-generated by database
    const { data: transaction, error: transactionError } = await (supabase as any)
      .from("supplier_transactions")
      .insert({
        supplier_id: transactionData.supplier_id,
        type: transactionData.type,
        total_amount: actualTotal,
        transaction_date: transactionData.transaction_date,
        notes: transactionData.notes,
        status: transactionData.status || "pending",
      })
      .select()
      .maybeSingle();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      throw transactionError;
    }
    
    if (!transaction) {
      throw new Error('Transaction was not created successfully');
    }

    // Create transaction items
    if (transactionData.items.length > 0) {
      const transactionItems = await Promise.all(
        transactionData.items.map(async (item) => {
          const itemTotal = await this.calculateItemTotal(item);
          return {
            transaction_id: transaction.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost, // Keep as display/average
            total_cost: itemTotal, // Use actual calculated total
            unit_details: {
              ...(item.unit_barcodes?.length ? { barcodes: item.unit_barcodes } : {}),
              ...(item.product_unit_ids?.length ? { product_unit_ids: item.product_unit_ids } : {})
            },
            product_unit_ids: item.product_unit_ids || null,
          };
        })
      );

      const { error: itemsError } = await (supabase as any)
        .from("supplier_transaction_items")
        .insert(transactionItems);

      if (itemsError) {
        // Rollback transaction if items creation fails
        await (supabase as any).from("supplier_transactions").delete().eq("id", transaction.id);
        throw itemsError;
      }
    }

    return transaction as SupplierTransaction;
  },

  async calculateTransactionTotal(items: CreateTransactionItemData[]): Promise<number> {
    let total = 0;
    for (const item of items) {
      total += await this.calculateItemTotal(item);
    }
    return total;
  },

  async calculateItemTotal(item: CreateTransactionItemData): Promise<number> {
    // Check if this product has serial numbers (individual units)
    const { data: product, error } = await supabase
      .from('products')
      .select('has_serial')
      .eq('id', item.product_id)
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch product info, using fallback calculation:', error);
      return item.quantity * item.unit_cost;
    }
    
    if (!product) {
      console.warn('Product not found, using fallback calculation');
      return item.quantity * item.unit_cost;
    }

    // For serialized products, use individual unit prices if available
    if (product.has_serial && item.product_unit_ids?.length) {
      try {
        const { data: units, error: unitsError } = await supabase
          .from('product_units')
          .select('purchase_price, price')
          .in('id', item.product_unit_ids);

        if (unitsError || !units) {
          console.warn('Failed to fetch unit prices, using fallback:', unitsError);
          return item.quantity * item.unit_cost;
        }

        // Sum actual purchase prices using hybrid pricing model
        return units.reduce((sum, unit) => {
          // Prioritize purchase_price, then individual unit price, then default unit_cost
          const unitPrice = unit.purchase_price > 0 ? unit.purchase_price :
                           unit.price > 0 ? unit.price : 
                           item.unit_cost;
          return sum + unitPrice;
        }, 0);
      } catch (error) {
        console.warn('Error calculating unit-based total:', error);
        return item.quantity * item.unit_cost;
      }
    }

    // For non-serialized products or when unit_ids not provided, use quantity * unit_cost
    return item.quantity * item.unit_cost;
  },

  async update(id: string, updates: UpdateTransactionData): Promise<void> {
    const { error } = await (supabase as any)
      .from("supplier_transactions")
      .update(updates)
      .eq("id", id);
    
    if (error) throw error;
    
    // Emit event for inventory coordination
    await eventBus.emit({
      type: EVENT_TYPES.SUPPLIER_TRANSACTION_UPDATED,
      module: 'suppliers',
      operation: 'update',
      entityId: id,
      data: { updates }
    });
  },

  async delete(id: string): Promise<void> {
    // Delete child items first to satisfy FK constraints
    const { error: itemsError } = await (supabase as any)
      .from("supplier_transaction_items")
      .delete()
      .eq("transaction_id", id);
    if (itemsError) throw itemsError;

    const { error } = await (supabase as any)
      .from("supplier_transactions")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  async getItems(transactionId: string): Promise<SupplierTransactionItem[]> {
    const { data, error } = await (supabase as any)
      .from("supplier_transaction_items")
      .select(`
        *,
        products (
          brand,
          model,
          has_serial
        )
      `)
      .eq("transaction_id", transactionId)
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return data as SupplierTransactionItem[];
  },

  async replaceItems(transactionId: string, items: EditableTransactionItem[]): Promise<void> {
    // Get existing items before deletion to track changes
    const existingItems = await this.getItems(transactionId);
    
    // Track affected products and changes for inventory coordination
    const affectedProducts = new Set<string>();
    const inventoryChanges: any[] = [];
    
    // Analyze changes for inventory coordination
    for (const existingItem of existingItems) {
      affectedProducts.add(existingItem.product_id);
    }
    
    for (const newItem of items) {
      affectedProducts.add(newItem.product_id);
    }

    // Delete existing items
    const { error: deleteError } = await (supabase as any)
      .from("supplier_transaction_items")
      .delete()
      .eq("transaction_id", transactionId);
    
    if (deleteError) throw deleteError;

    // Insert new items if any
    if (items.length > 0) {
      const itemsToInsert = await Promise.all(
        items.map(async (item) => {
          const itemTotal = await this.calculateItemTotal(item);
          
          // Track inventory changes for product units
          if (item.product_unit_ids?.length) {
            inventoryChanges.push({
              type: 'unit_update',
              productId: item.product_id,
              productUnitIds: item.product_unit_ids,
              purchasePrice: item.unit_cost
            });
          }
          
          return {
            transaction_id: transactionId,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: itemTotal,
            unit_details: {
              ...(item.unit_barcodes?.length ? { barcodes: item.unit_barcodes } : {}),
              ...(item.product_unit_ids?.length ? { product_unit_ids: item.product_unit_ids } : {})
            },
            product_unit_ids: item.product_unit_ids || null,
          };
        })
      );

      const { error: insertError } = await (supabase as any)
        .from("supplier_transaction_items")
        .insert(itemsToInsert);
      
      if (insertError) throw insertError;
      
      // Update individual product unit prices based on hybrid pricing model
      for (const item of items) {
        if (item.product_unit_ids?.length) {
          try {
            // Get the actual unit entries to use individual prices if specified
            const { data: units } = await supabase
              .from('product_units')
              .select('id, price, purchase_price')
              .in('id', item.product_unit_ids);
              
            for (const unitId of item.product_unit_ids) {
              const unit = units?.find(u => u.id === unitId);
              // Only update if the unit doesn't already have a proper purchase_price
              if (unit && (!unit.purchase_price || unit.purchase_price === 0)) {
                const newPurchasePrice = unit.price || item.unit_cost;
                await ProductUnitManagementService.updateUnitPurchasePrice(unitId, newPurchasePrice);
              }
            }
          } catch (error) {
            console.error('Error updating product unit purchase prices:', error);
            // Don't throw to prevent blocking the main operation
          }
        }
      }
    }

    // Emit event for inventory coordination
    await eventBus.emit({
      type: EVENT_TYPES.SUPPLIER_TRANSACTION_ITEMS_REPLACED,
      module: 'suppliers',
      operation: 'update',
      entityId: transactionId,
      data: {
        changes: inventoryChanges,
        affectedProducts: Array.from(affectedProducts)
      }
    });
  },

  async getSummary(filters: TransactionSearchFilters = {}): Promise<TransactionSummary> {
    let query = (supabase as any)
      .from("supplier_transactions")
      .select("type, status, total_amount");

    // Apply same filters as getAll
    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    if (filters.dateFrom) {
      query = query.gte('transaction_date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('transaction_date', filters.dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate summary
    const summary: TransactionSummary = {
      total_transactions: data.length,
      total_amount: data.reduce((sum, t) => sum + t.total_amount, 0),
      pending_count: data.filter(t => t.status === 'pending').length,
      completed_count: data.filter(t => t.status === 'completed').length,
      cancelled_count: data.filter(t => t.status === 'cancelled').length,
      purchase_amount: data.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.total_amount, 0),
      payment_amount: data.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.total_amount, 0),
      return_amount: data.filter(t => t.type === 'return').reduce((sum, t) => sum + t.total_amount, 0),
    };

    return summary;
  },
};

// ============= REACT QUERY HOOKS =============
export function useSupplierTransactions(
  searchQuery?: string,
  filters: TransactionSearchFilters = {}
) {
  const queryClient = useQueryClient();
  
  const queryKey = [
    ...SUPPLIER_TRANSACTION_KEYS.lists(),
    searchQuery ?? '',
    filters.type ?? 'all',
    filters.status ?? 'all',
    filters.supplier_id ?? null,
    filters.dateFrom ?? null,
    filters.dateTo ?? null,
  ];
  
  // Listen for cross-module events
  useEffect(() => {
    const unsubscribe = UnifiedProductCoordinator.addEventListener((event) => {
      if (event.source === 'inventory') {
        console.log('💨 SupplierTransactionService: Invalidating due to inventory change');
        queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.all });
      }
    });
    return unsubscribe;
  }, [queryClient]);
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Fetch transactions with filters (NOT search)
      const transactions = await supplierTransactionApi.getAll(filters);
      
      // Enrich with unit data
      const enriched = await supplierTransactionApi.enrichTransactionUnits(transactions);
      
      // Apply client-side search if query exists
      if (searchQuery && searchQuery.trim()) {
        return supplierTransactionApi.searchTransactions(enriched, searchQuery);
      }
      
      return enriched;
    },
    staleTime: 0, // Always fresh for search
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });
}

export function useSupplierTransaction(id: string) {
  return useQuery({
    queryKey: SUPPLIER_TRANSACTION_KEYS.detail(id),
    queryFn: () => supplierTransactionApi.getById(id),
    enabled: !!id,
  });
}

export function useSupplierTransactionItems(transactionId: string) {
  return useQuery({
    queryKey: SUPPLIER_TRANSACTION_KEYS.items(transactionId),
    queryFn: () => supplierTransactionApi.getItems(transactionId),
    enabled: !!transactionId,
  });
}

export function useTransactionSummary(filters: TransactionSearchFilters = {}) {
  return useQuery({
    queryKey: SUPPLIER_TRANSACTION_KEYS.summary(),
    queryFn: () => supplierTransactionApi.getSummary(filters),
  });
}

export function useCreateSupplierTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supplierTransactionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.all });
    },
  });
}

export function useUpdateSupplierTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTransactionData }) =>
      supplierTransactionApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.all });
    },
  });
}

export function useDeleteSupplierTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supplierTransactionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.all });
    },
  });
}

export function useReplaceSupplierTransactionItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ transactionId, items }: { transactionId: string; items: EditableTransactionItem[] }) =>
      supplierTransactionApi.replaceItems(transactionId, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.items(variables.transactionId) });
    },
  });
}