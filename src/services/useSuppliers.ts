import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  status?: "active" | "inactive";
}

export function useSuppliers() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      console.log("Fetching suppliers...");
      const { data, error } = await (supabase as any)
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
      }

      console.log("Suppliers fetched successfully:", data);
      return data as Supplier[];
    },
  });

  const createSupplier = useMutation({
    mutationFn: async (supplierData: CreateSupplierData) => {
      console.log("Creating supplier:", supplierData);
      const { data, error } = await (supabase as any)
        .from("suppliers")
        .insert([supplierData])
        .select()
        .single();

      if (error) {
        console.error("Error creating supplier:", error);
        throw error;
      }

      console.log("Supplier created successfully:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...supplierData }: CreateSupplierData & { id: string }) => {
      console.log("Updating supplier:", id, supplierData);
      const { data, error } = await (supabase as any)
        .from("suppliers")
        .update(supplierData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating supplier:", error);
        throw error;
      }

      console.log("Supplier updated successfully:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting supplier:", id);
      const { error } = await (supabase as any)
        .from("suppliers")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting supplier:", error);
        throw error;
      }

      console.log("Supplier deleted successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  return {
    data,
    isLoading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}