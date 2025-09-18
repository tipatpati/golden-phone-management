import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { SalesApiService } from './SalesApiService';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { eventBus, EVENT_TYPES } from '../core/EventBus';
import { SalesInventoryIntegration } from '../core/IntegrationServices';
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
    mutationFn: async (saleData: CreateSaleData) => {
      // Pre-validate with orchestration
      await SalesInventoryIntegration.validateAndCreateSale(saleData);
      
      // Create the sale
      const result = await salesApiService.create(saleData);
      
      // Process inventory impact through orchestration
      await SalesInventoryIntegration.processInventoryImpact(result.id, saleData);
      
      return result;
    },
    onSuccess: (result, saleData) => {
      // Emit sale created event
      eventBus.emit({
        type: EVENT_TYPES.SALE_CREATED,
        module: 'sales',
        operation: 'create',
        entityId: result.id,
        data: saleData
      });
      
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSaleData> }) => {
      // Get original sale for validation
      const originalSale = queryClient.getQueryData(['sales', id]);
      
      // Smart validation: Only validate inventory if sale_items actually changed
      if (originalSale && data.sale_items) {
        const originalSaleTyped = originalSale as Sale;
        const originalItems = originalSaleTyped.sale_items || [];
        const newItems = data.sale_items || [];
        
        // Check if sale items actually changed (not just payment/client/notes)
        const itemsChanged = JSON.stringify(originalItems) !== JSON.stringify(newItems);
        
        if (itemsChanged) {
          await SalesInventoryIntegration.validateInventoryForSaleUpdate(originalSaleTyped, data);
        }
      }
      
      return salesApiService.update(id, data);
    },
    onSuccess: (result, { id, data }) => {
      // Emit sale updated event
      eventBus.emit({
        type: EVENT_TYPES.SALE_UPDATED,
        module: 'sales',
        operation: 'update',
        entityId: id,
        data: data
      });
      
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
    onSuccess: (result, id) => {
      // Emit sale deleted event
      eventBus.emit({
        type: EVENT_TYPES.SALE_DELETED,
        module: 'sales',
        operation: 'delete',
        entityId: id,
        data: { deletedSale: result }
      });
      
      // Force immediate refresh for sales operations
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
      // Also invalidate products since sales affect inventory
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export type { Sale, CreateSaleData };