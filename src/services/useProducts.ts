
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseProductApi } from './supabaseProducts';
import { toast } from '@/components/ui/sonner';

// Use the Product type from supabaseProducts
export type { Product } from './supabaseProducts';

export function useProducts(searchTerm: string = '') {
  return useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => supabaseProductApi.getProducts(searchTerm),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => supabaseProductApi.getProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supabaseProductApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: any) => {
      console.error('Create product error:', error);
      toast.error('Failed to create product', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, product }: { id: string, product: any }) => 
      supabaseProductApi.updateProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: any) => {
      console.error('Update product error:', error);
      toast.error('Failed to update product', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supabaseProductApi.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: any) => {
      console.error('Delete product error:', error);
      toast.error('Failed to delete product', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: supabaseProductApi.getCategories,
  });
}

export function useProductRecommendations(productId: string) {
  return useQuery({
    queryKey: ['product-recommendations', productId],
    queryFn: () => supabaseProductApi.getProductRecommendations(productId),
    enabled: !!productId,
  });
}
