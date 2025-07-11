import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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