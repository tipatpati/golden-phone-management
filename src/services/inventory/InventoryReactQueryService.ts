import { InventoryManagementService } from './InventoryManagementService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { eventBus, EVENT_TYPES } from '../core/EventBus';
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
    onSuccess: (result, productData) => {
      // Emit product created event
      eventBus.emit({
        type: EVENT_TYPES.PRODUCT_CREATED,
        module: 'inventory',
        operation: 'create',
        entityId: (result as any).id || 'unknown',
        data: productData
      });
      
      // Invalidate all product-related queries for immediate refresh
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.refetchQueries({ queryKey: ['products', 'list'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductData> }) => 
      InventoryManagementService.updateProduct(id, data),
    onSuccess: (result, { id, data }) => {
      // Emit product updated event
      eventBus.emit({
        type: EVENT_TYPES.PRODUCT_UPDATED,
        module: 'inventory',
        operation: 'update',
        entityId: id,
        data: data
      });
      
      // Check if stock changed
      if (data.stock !== undefined) {
        eventBus.emit({
          type: EVENT_TYPES.STOCK_CHANGED,
          module: 'inventory',
          operation: 'update',
          entityId: id,
          data: { newStock: data.stock, reason: 'product_updated' }
        });
      }
      
      // Invalidate all product-related queries for immediate refresh
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', id] });
      queryClient.refetchQueries({ queryKey: ['products', 'list'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => InventoryManagementService.deleteProduct(id),
    onSuccess: (result, id) => {
      // Emit product deleted event
      eventBus.emit({
        type: EVENT_TYPES.PRODUCT_DELETED,
        module: 'inventory',
        operation: 'delete',
        entityId: id,
        data: { deletedProduct: result }
      });
      
      // Invalidate and refetch all product queries for immediate refresh
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.refetchQueries({ queryKey: ['products', 'list'] });
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
      // Force immediate refresh for bulk operations
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.refetchQueries({ queryKey: ['products', 'list'] });
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
      // Force immediate refresh for bulk operations
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.refetchQueries({ queryKey: ['products', 'list'] });
    },
  });
};

export type { Product, CreateProductData, ProductFormData };