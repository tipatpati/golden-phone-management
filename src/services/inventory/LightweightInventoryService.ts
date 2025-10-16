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
        created_at,
        category:categories!inner (
          id,
          name
        ),
        units:product_units(id, product_id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price, condition)
      `);

    // Category filter - apply FIRST to narrow down dataset
    if (categoryId !== 'all') {
      query = query.eq('category_id', categoryId);
    }

    // Stock status filter
    if (stockStatus === 'in_stock') {
      query = query.gt('stock', 0);
    } else if (stockStatus === 'low_stock') {
      // Products with stock > 0 but <= threshold
      query = query.gt('stock', 0).filter('stock', 'lte', 'threshold');
    } else if (stockStatus === 'out_of_stock') {
      query = query.eq('stock', 0);
    }

    // Serial tracking filter
    if (hasSerial !== 'all') {
      query = query.eq('has_serial', hasSerial === 'yes');
    }

    // Date range filter
    if (dateRange?.start) {
      query = query.gte('created_at', dateRange.start.toISOString());
    }
    if (dateRange?.end) {
      query = query.lte('created_at', dateRange.end.toISOString());
    }

    // Price range filter
    if (priceRange?.min !== undefined) {
      query = query.gte('price', priceRange.min);
    }
    if (priceRange?.max !== undefined) {
      query = query.lte('price', priceRange.max);
    }

    // Year filter
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
      console.error('Error fetching products:', error);
      throw error;
    }

    let results = data || [];
    
    console.log('📊 Query returned:', results.length, 'products with filters:', { categoryId, stockStatus, hasSerial, year, sortBy });

    // Client-side search filtering - allows searching across all fields including product_units
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      console.log('🔍 Filtering search term:', term, 'from', results.length, 'products');
      
      results = results.filter(product => {
        // Search in main product fields
        const brandMatch = product.brand?.toLowerCase().includes(term);
        const modelMatch = product.model?.toLowerCase().includes(term);
        const barcodeMatch = product.barcode?.toLowerCase().includes(term);
        const descriptionMatch = product.description?.toLowerCase().includes(term);
        
        // Search in serial_numbers array
        const serialArrayMatch = product.serial_numbers?.some((sn: string) => 
          sn?.toLowerCase().includes(term)
        );
        
        // Search in product_units for serial numbers and barcodes
        const unitsMatch = product.units?.some((unit: any) => 
          unit.serial_number?.toLowerCase().includes(term) ||
          unit.barcode?.toLowerCase().includes(term)
        );
        
        return brandMatch || modelMatch || barcodeMatch || descriptionMatch || serialArrayMatch || unitsMatch;
      });
      
      console.log('✅ Search filtered to', results.length, 'products');
    }

    return results;
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