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
      // Debug: Log VAT state being sent to API
      console.log('🔥 useCreateSale - Sending sale data with VAT state:', {
        vat_included: saleData.vat_included,
        payment_method: saleData.payment_method,
        total_amount: saleData.total_amount,
        saleData: saleData
      });
      
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
      console.log('🔄 Starting sale update process', { saleId: id, updateData: data });
      
      try {
        // Get original sale for validation
        const originalSale = queryClient.getQueryData(['sales', id]);
        console.log('📋 Original sale data', originalSale);
        
        // Smart validation: Only validate inventory if sale_items actually changed
        // Note: sale_items is NOT a column in sales table - it's a separate table relationship
        if (originalSale && data.sale_items) {
          console.log('⚠️ Warning: sale_items should not be included in sales table update');
          console.log('Sale items are managed in separate sale_items table');
          
          // Remove sale_items from update data to prevent schema error
          const cleanedData = { ...data };
          delete cleanedData.sale_items;
          
          console.log('🧹 Cleaned update data (removed sale_items):', cleanedData);
          
          // For now, skip inventory validation since we're not updating items
          console.log('⏩ Skipping inventory validation - sale items handled separately');
          
          // Update the data parameter to the cleaned version
          data = cleanedData;
        } else {
          console.log('⏩ No sale_items in update data - proceeding with normal update');
        }
        
        console.log('🚀 Calling API update...');
        const result = await salesApiService.update(id, data);
        console.log('✅ API update successful', result);
        return result;
        
      } catch (error) {
        console.error('❌ Sale update error:', error);
        console.error('Error details:', {
          message: error?.message,
          stack: error?.stack,
          cause: error?.cause
        });
        throw error;
      }
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