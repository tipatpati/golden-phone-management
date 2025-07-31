import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { ProductApiService } from './ProductApiService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product, CreateProductData } from './types';

class ProductReactQueryServiceClass extends BaseReactQueryService<Product, CreateProductData> {
  constructor() {
    const apiService = new ProductApiService();
    super(apiService, 'products', { queryConfig: 'realtime' });
  }

  protected getSearchFields(): string[] {
    return ['brand', 'model', 'barcode'];
  }

  useCategories() {
    return useOptimizedQuery(
      ['categories'],
      () => (this.apiService as ProductApiService).getCategories(),
      'static'
    );
  }

  useProductRecommendations(productId: string) {
    return useOptimizedQuery(
      ['product-recommendations', productId],
      () => (this.apiService as ProductApiService).getProductRecommendations(productId),
      'moderate'
    );
  }

  // Real-time subscription hook for products
  useProductsRealtime() {
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
  }
}

export const productService = new ProductReactQueryServiceClass();

// Export hooks for use in components
export const useProducts = (searchTerm: string = '') => 
  productService.useGetAll(searchTerm);

export const useProduct = (id: string) => 
  productService.useGetById(id);

export const useCreateProduct = () => 
  productService.useCreate();

export const useUpdateProduct = () => 
  productService.useUpdate();

export const useDeleteProduct = () => 
  productService.useDelete();

export const useCategories = () => 
  productService.useCategories();

export const useProductRecommendations = (productId: string) => 
  productService.useProductRecommendations(productId);

export const useProductsRealtime = () => 
  productService.useProductsRealtime();

export type { Product, CreateProductData };