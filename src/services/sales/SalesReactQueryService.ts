import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { SalesApiService } from './SalesApiService';
import type { Sale, CreateSaleData } from './types';

class SalesReactQueryServiceClass extends BaseReactQueryService<Sale, CreateSaleData> {
  constructor() {
    const apiService = new SalesApiService();
    super(apiService, 'sales', { 
      queryConfig: 'moderate',
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
export const useSales = (searchTerm: string = '') => 
  salesService.useGetAll(searchTerm);

export const useSale = (id: string) => 
  salesService.useGetById(id);

export const useCreateSale = () => 
  salesService.useCreateWithProductInvalidation();

export const useUpdateSale = () => 
  salesService.useUpdate();

export const useDeleteSale = () => 
  salesService.useDelete();

export type { Sale, CreateSaleData };