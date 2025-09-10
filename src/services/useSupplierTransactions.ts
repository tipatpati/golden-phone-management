import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedProductCoordinator } from "@/services/shared/UnifiedProductCoordinator";

export interface SupplierTransaction {
  id: string;
  supplier_id: string;
  transaction_number: string;
  type: "purchase" | "payment" | "return";
  total_amount: number;
  transaction_date: string;
  notes?: string;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  suppliers?: {
    name: string;
  };
}

export interface SupplierTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  unit_details?: any;
}

export interface CreateTransactionData {
  supplier_id: string;
  type: "purchase" | "payment" | "return";
  total_amount: number;
  transaction_date: string;
  notes?: string;
  status?: "pending" | "completed" | "cancelled";
  items: {
    product_id: string;
    quantity: number;
    unit_cost: number;
  }[];
}

export function useSupplierTransactions() {
  const queryClient = useQueryClient();

  // ============================================
  // CROSS-MODULE SYNC
  // ============================================
  
  useEffect(() => {
    // Listen for product/unit changes from inventory module
    const unsubscribe = UnifiedProductCoordinator.addEventListener((event) => {
      console.log('🔄 Supplier: Received coordination event:', event.type, 'from', event.source, event.metadata);
      
      if (event.source === 'inventory') {
        // Aggressively invalidate relevant queries when inventory creates/updates products/units
        switch (event.type) {
          case 'product_created':
          case 'product_updated':
          case 'unit_created':
          case 'unit_updated':
          case 'stock_updated':
            console.log('💨 Supplier: Aggressively invalidating caches due to inventory change');
            queryClient.invalidateQueries({ queryKey: ["supplier-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["supplier-transaction-items"] });
            
            // Force immediate refetch for critical operations
            if (['product_created', 'unit_created', 'stock_updated'].includes(event.type)) {
              setTimeout(() => {
                queryClient.refetchQueries({ queryKey: ["supplier-transactions"] });
                console.log('🚀 Forced supplier transaction refetch');
              }, 100);
            }
            break;
            
          case 'sync_requested':
            console.log('💨 Supplier: Full sync requested from inventory');
            queryClient.invalidateQueries({ queryKey: ["supplier-transactions"] });
            queryClient.invalidateQueries({ queryKey: ["supplier-transaction-items"] });
            break;
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["supplier-transactions"],
    queryFn: async () => {
      console.log("Fetching supplier transactions...");
      const { data, error } = await (supabase as any)
        .from("supplier_transactions")
        .select(`
          *,
          suppliers (
            name
          )
        `)
        .order("transaction_date", { ascending: false });

      if (error) {
        console.error("Error fetching supplier transactions:", error);
        throw error;
      }

      console.log("Supplier transactions fetched successfully:", data);
      return data as SupplierTransaction[];
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (transactionData: CreateTransactionData) => {
      console.log("Creating supplier transaction:", transactionData);
      
      // Start a transaction
      const { data: transaction, error: transactionError } = await (supabase as any)
        .from("supplier_transactions")
        .insert({
          supplier_id: transactionData.supplier_id,
          type: transactionData.type,
          total_amount: transactionData.total_amount,
          transaction_date: transactionData.transaction_date,
          notes: transactionData.notes,
          status: transactionData.status || "pending",
        })
        .select()
        .single();

      if (transactionError) {
        console.error("Error creating supplier transaction:", transactionError);
        throw transactionError;
      }

      // Create transaction items
      const transactionItems = transactionData.items.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        total_cost: item.quantity * item.unit_cost,
      }));

      const { error: itemsError } = await (supabase as any)
        .from("supplier_transaction_items")
        .insert(transactionItems);

      if (itemsError) {
        console.error("Error creating transaction items:", itemsError);
        // If items creation fails, we should delete the transaction
        await (supabase as any).from("supplier_transactions").delete().eq("id", transaction.id);
        throw itemsError;
      }

      console.log("Supplier transaction created successfully:", transaction);
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-transactions"] });
    },
  });

  return {
    data,
    isLoading,
    error,
    createTransaction,
  };
}

export interface EditableTransactionItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  unit_barcodes?: string[];
}

export function useUpdateSupplierTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      updates: Partial<Pick<SupplierTransaction, "status" | "notes" | "type" | "transaction_date" | "total_amount">>;
    }) => {
      const { id, updates } = payload;
      const { error } = await (supabase as any)
        .from("supplier_transactions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-transactions"] });
    },
  });
}

export function useReplaceSupplierTransactionItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { transaction_id: string; items: EditableTransactionItem[] }) => {
      const { transaction_id, items } = payload;
      // Replace all items for transaction in a simple way
      const { error: delError } = await (supabase as any)
        .from("supplier_transaction_items")
        .delete()
        .eq("transaction_id", transaction_id);
      if (delError) throw delError;

      if (!items.length) return true;

      const toInsert = items.map((it) => ({
        transaction_id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        total_cost: it.quantity * it.unit_cost,
        unit_details: it.unit_barcodes && it.unit_barcodes.length ? { barcodes: it.unit_barcodes } : {},
      }));

      const { error: insError } = await (supabase as any)
        .from("supplier_transaction_items")
        .insert(toInsert);
      if (insError) throw insError;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-transactions"] });
    },
  });
}

export function useSupplierTransactionItems(transaction_id: string | null) {
  return useQuery({
    enabled: !!transaction_id,
    queryKey: ["supplier-transaction-items", transaction_id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("supplier_transaction_items")
        .select("id, transaction_id, product_id, quantity, unit_cost, total_cost, unit_details")
        .eq("transaction_id", transaction_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as SupplierTransactionItem[];
    },
  });
}
