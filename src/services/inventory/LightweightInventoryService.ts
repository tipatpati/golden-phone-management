import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product, CreateProductData } from './types';

class LightweightInventoryService {
  async getProducts(filters: {
    categoryId?: number | 'all';
    stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
    hasSerial?: 'all' | 'yes' | 'no';
    searchTerm?: string;
    dateRange?: { start?: Date; end?: Date };
    priceRange?: { min?: number; max?: number };
    year?: number | 'all';
    sortBy?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
  } = {}): Promise<Product[]> {
    const {
      categoryId = 'all',
      stockStatus = 'all',
      hasSerial = 'all',
      searchTerm = '',
      dateRange,
      priceRange,
      year = 'all',
      sortBy = 'newest'
    } = filters;

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories!inner(id, name),
        units:product_units(id, product_id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price, condition)
      `);

    // Server-side search for brand/model (only if searchTerm provided)
    if (searchTerm && searchTerm.trim()) {
      const term = `%${searchTerm.trim()}%`;
      query = query.or(`brand.ilike.${term},model.ilike.${term}`);
    }

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

    // Note: Search filtering is done client-side after fetching to include unit serial/barcode matching

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

    if (error) throw error;
    
    let products = data || [];

    // Client-side prioritization: unit matches (serial/barcode) appear first
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      
      // Separate products into categories for prioritized sorting
      const exactUnitMatches: typeof products = [];
      const brandModelMatches: typeof products = [];
      
      products.forEach(product => {
        // Check product units for serial/barcode match
        const unitMatch = product.units?.some((unit: any) => 
          unit.serial_number?.toLowerCase().includes(term) || 
          unit.barcode?.toLowerCase().includes(term)
        );
        
        // Prioritize: unit matches first, then brand/model matches (already filtered by server)
        if (unitMatch) {
          exactUnitMatches.push(product);
        } else {
          brandModelMatches.push(product);
        }
      });
      
      // Return prioritized results: unit matches at top, then brand/model matches
      products = [...exactUnitMatches, ...brandModelMatches];
    }
    
    return products;
  }

  async createProduct(productData: any): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select(`
        *,
        category:categories!inner(id, name),
        units:product_units(id, product_id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price, condition)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProduct(id: string, updates: any): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:categories!inner(id, name),
        units:product_units(id, product_id, serial_number, barcode, color, storage, ram, battery_level, status, price, min_price, max_price, condition)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

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

export const useProducts = (filters?: {
  categoryId?: number | 'all';
  stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  hasSerial?: 'all' | 'yes' | 'no';
  searchTerm?: string;
  dateRange?: { start?: Date; end?: Date };
  priceRange?: { min?: number; max?: number };
  year?: number | 'all';
  sortBy?: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
}) => {
  // Create a stable query key by extracting primitive values
  const queryKey = [
    'products',
    filters?.categoryId ?? 'all',
    filters?.stockStatus ?? 'all',
    filters?.hasSerial ?? 'all',
    filters?.searchTerm ?? '',
    filters?.dateRange?.start?.getTime() ?? null,
    filters?.dateRange?.end?.getTime() ?? null,
    filters?.priceRange?.min ?? null,
    filters?.priceRange?.max ?? null,
    filters?.year ?? 'all',
    filters?.sortBy ?? 'newest',
  ];

  return useQuery({
    queryKey,
    queryFn: () => service.getProducts(filters || {}),
    staleTime: 0, // Always treat data as stale for real-time updates
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always refetch on mount to ensure fresh data
    refetchOnReconnect: false,
    refetchInterval: false, // No automatic polling
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: service.createProduct,
    onSuccess: () => {
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
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export default service;
