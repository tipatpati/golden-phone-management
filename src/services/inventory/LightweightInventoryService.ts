import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, CreateProductData } from './types';

// Lightweight service with simple queries and minimal overhead
class LightweightInventoryService {
  /**
   * Get products with simple search - no complex serial number logic
   */
  async getProducts(searchTerm = ''): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        id,
        brand,
        model,
        year,
        category_id,
        price,
        min_price,
        max_price,
        stock,
        threshold,
        description,
        supplier,
        barcode,
        has_serial,
        serial_numbers,
        category:categories!inner (
          id,
          name
        ),
        units:product_units(id, product_id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price, condition)
      `)
      .order('brand', { ascending: true })
      .order('model', { ascending: true });

    // Simple search - just brand and model
    if (searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(`brand.ilike.${term},model.ilike.${term},barcode.eq.${searchTerm.trim()}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create product - simple operation
   */
  async createProduct(productData: any): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select(`
        id,
        brand,
        model,
        year,
        category_id,
        price,
        min_price,
        max_price,
        stock,
        threshold,
        description,
        supplier,
        barcode,
        has_serial,
        serial_numbers,
        category:categories!inner (
          id,
          name
        ),
        units:product_units(id, product_id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price, condition)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update product - simple operation
   */
  async updateProduct(id: string, updates: any): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select(`
        id,
        brand,
        model,
        year,
        category_id,
        price,
        min_price,
        max_price,
        stock,
        threshold,
        description,
        supplier,
        barcode,
        has_serial,
        serial_numbers,
        category:categories!inner (
          id,
          name
        ),
        units:product_units(id, product_id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price, condition)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete product - simple operation
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get categories - cached for 15 minutes
   */
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

const service = new LightweightInventoryService();

// Lightweight React Query hooks with minimal configuration
export const useProducts = (searchTerm = '') => {
  return useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => service.getProducts(searchTerm),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: service.createProduct,
    onSuccess: () => {
      // Simple invalidation - no complex cache management
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      service.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: service.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: service.getCategories,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export default service;