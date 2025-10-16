import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, CreateProductData } from './types';

// Lightweight service with simple queries and minimal overhead
class LightweightInventoryService {
  /**
   * Get products with comprehensive filtering
   */
  async getProducts(filters: {
    searchTerm?: string;
    categoryId?: number | 'all';
    stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
    hasSerial?: 'all' | 'yes' | 'no';
    dateRange?: { start?: Date; end?: Date };
    priceRange?: { min?: number; max?: number };
    year?: number | 'all';
    sortBy?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
  } = {}): Promise<Product[]> {
    const {
      searchTerm = '',
      categoryId = 'all',
      stockStatus = 'all',
      hasSerial = 'all',
      dateRange,
      priceRange,
      year = 'all',
      sortBy = 'newest'
    } = filters;

    console.log('🔍 [SEARCH] getProducts called with:', { searchTerm, categoryId, stockStatus });

    // SIMPLE SEARCH: If there's a search term, use it
    if (searchTerm && searchTerm.trim().length > 0) {
      console.log('🔍 [SEARCH] Searching for:', searchTerm.trim());
      
      const { data, error } = await supabase
        .rpc('search_inventory', { search_text: searchTerm.trim() });

      if (error) {
        console.error('❌ [SEARCH] Error:', error);
        throw error;
      }

      console.log('✅ [SEARCH] Raw results:', data?.length, 'products');
      
      // Transform to proper format
      const products = (data || []).map((item: any) => ({
        ...item,
        category: item.category_name ? {
          id: item.category_id,
          name: item.category_name
        } : null,
        units: item.unit_data || []
      }));

      console.log('✅ [SEARCH] Returning', products.length, 'products');
      return products;
    }

    // NO SEARCH: Regular filtered query
    console.log('📋 [QUERY] No search term, fetching with filters');
    
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name),
        units:product_units(id, product_id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price, condition)
      `);

    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    if (stockStatus === 'in_stock') {
      query = query.gt('stock', 0);
    } else if (stockStatus === 'low_stock') {
      query = query.gt('stock', 0).filter('stock', 'lte', 'threshold');
    } else if (stockStatus === 'out_of_stock') {
      query = query.eq('stock', 0);
    }

    if (hasSerial !== 'all') {
      query = query.eq('has_serial', hasSerial === 'yes');
    }

    if (dateRange?.start) {
      query = query.gte('created_at', dateRange.start.toISOString());
    }
    if (dateRange?.end) {
      query = query.lte('created_at', dateRange.end.toISOString());
    }

    if (priceRange?.min !== undefined) {
      query = query.gte('price', priceRange.min);
    }
    if (priceRange?.max !== undefined) {
      query = query.lte('price', priceRange.max);
    }

    if (year !== 'all') {
      query = query.eq('year', year);
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'name_asc':
        query = query.order('brand', { ascending: true }).order('model', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('brand', { ascending: false }).order('model', { ascending: false });
        break;
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      default:
        query = query.order('brand', { ascending: true }).order('model', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ [QUERY] Error:', error);
      throw error;
    }

    console.log('✅ [QUERY] Returning', data?.length || 0, 'products');
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
export const useProducts = (filters?: {
  searchTerm?: string;
  categoryId?: number | 'all';
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  hasSerial?: 'all' | 'yes' | 'no';
  dateRange?: { start?: Date; end?: Date };
  priceRange?: { min?: number; max?: number };
  year?: number | 'all';
  sortBy?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => service.getProducts(filters || {}),
    staleTime: 0, // Always fetch fresh data when filters change
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Ensure fresh data on component mount
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