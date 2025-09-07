import { InventoryManagementService } from './InventoryManagementService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product, CreateProductData, ProductFormData } from './types';

// Direct hook implementations for inventory management

export const useProducts = (searchTerm: string = '') => {
  return useOptimizedQuery(
    ['products', 'list', searchTerm],
    () => InventoryManagementService.getProducts({ searchTerm }),
    'realtime'
  );
};

export const useProduct = (id: string) => {
  return useOptimizedQuery(
    ['products', 'detail', id],
    () => InventoryManagementService.getProductWithUnits(id),
    'realtime'
  );
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData: CreateProductData) => 
      InventoryManagementService.createProduct(productData as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductData> }) => 
      InventoryManagementService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => InventoryManagementService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useCategories = () => {
  return useOptimizedQuery(
    ['categories'],
    () => InventoryManagementService.getCategories(),
    'static'
  );
};

export const useProductRecommendations = (productId: string) => {
  return useOptimizedQuery(
    ['product-recommendations', productId],
    () => Promise.resolve([]), // TODO: Implement recommendations
    'moderate'
  );
};

// Real-time subscription hook for products
export const useProductsRealtime = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('🔄 Products table changed:', payload);
          
          // More efficient updates based on the change type
          if (payload.eventType === 'UPDATE' && payload.new) {
            // Optimistically update specific product in cache
            const updatedProduct = payload.new;
            
            // Update specific product cache
            queryClient.setQueryData(['products', 'detail', updatedProduct.id], updatedProduct);
            
            // Update list cache efficiently
            queryClient.setQueryData(['products', 'list'], (old: any) => {
              if (!old) return old;
              return old.map((product: any) => 
                product.id === updatedProduct.id ? updatedProduct : product
              );
            });
            
            // Update search results
            queryClient.setQueriesData(
              { queryKey: ['products', 'list'] }, 
              (old: any) => {
                if (!old) return old;
                return old.map((product: any) => 
                  product.id === updatedProduct.id ? updatedProduct : product
                );
              }
            );
          } else {
            // For INSERT/DELETE, just invalidate to refetch
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

// Bulk operations
export const useDeleteProducts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: string[]) => InventoryManagementService.bulkDeleteProducts({ productIds: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProducts = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (updates: Array<{ id: string; [key: string]: any }>) => {
      if (updates.length === 0) return Promise.resolve({ success: true });
      
      const { id, ...updateData } = updates[0];
      const productIds = updates.map(u => u.id);
      
      return InventoryManagementService.bulkUpdateProducts({
        productIds,
        updates: updateData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export type { Product, CreateProductData, ProductFormData };