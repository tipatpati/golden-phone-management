import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { SalesApiService } from './SalesApiService';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Sale, CreateSaleData } from './types';

class SalesReactQueryServiceClass extends BaseReactQueryService<Sale, CreateSaleData> {
  constructor() {
    const apiService = new SalesApiService();
    super(apiService, 'sales', { 
      queryConfig: 'realtime',
      optimistic: true 
    });
  }

  protected getSearchFields(): string[] {
    return ['sale_number', 'notes'];
  }

  // Custom method for invalidating related queries
  useCreateWithProductInvalidation() {
    const createMutation = this.useCreate({
      onSuccess: (data, variables, context) => {
        // The onSuccess callback runs in the mutation context where we can access queryClient
        // This will be handled by the base class useCreate method
      }
    });
    
    return createMutation;
  }
}

export const salesService = new SalesReactQueryServiceClass();

// Export hooks for use in components
export const useSales = (searchTerm?: string) => {
  // Use search method when searchTerm is provided, otherwise use getAll
  if (searchTerm && searchTerm.trim()) {
    return salesService.useSearch(searchTerm.trim());
  }
  return salesService.useGetAll();
};

export const useSale = (id: string) => 
  salesService.useGetById(id);

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  const salesApiService = new SalesApiService();
  
  return useMutation({
    mutationFn: (saleData: CreateSaleData) => salesApiService.create(saleData),
    onSuccess: () => {
      // Force immediate refresh for sales operations
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
      // Also invalidate products since sales affect inventory
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  const salesApiService = new SalesApiService();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSaleData> }) => 
      salesApiService.update(id, data),
    onSuccess: (result, { id }) => {
      // Force immediate refresh for sales operations
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales', id] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
      // Also invalidate products since sales affect inventory
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  const salesApiService = new SalesApiService();
  
  return useMutation({
    mutationFn: (id: string) => salesApiService.delete(id),
    onSuccess: () => {
      // Force immediate refresh for sales operations
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
      // Also invalidate products since sales affect inventory
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export type { Sale, CreateSaleData };