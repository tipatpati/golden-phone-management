
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseSalesApi } from './sales';
import { toast } from '@/components/ui/sonner';

export type { Sale, SaleItem } from './sales';

export function useSales(searchTerm: string = '') {
  return useQuery({
    queryKey: ['sales', searchTerm],
    queryFn: () => supabaseSalesApi.getSales(searchTerm),
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: ['sale', id],
    queryFn: () => supabaseSalesApi.getSale(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supabaseSalesApi.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Sale created successfully');
    },
    onError: (error: any) => {
      console.error('Create sale error:', error);
      toast.error('Failed to create sale', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, sale }: { id: string, sale: any }) => 
      supabaseSalesApi.updateSale(id, sale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Sale updated successfully');
    },
    onError: (error: any) => {
      console.error('Update sale error:', error);
      toast.error('Failed to update sale', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supabaseSalesApi.deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Sale deleted successfully');
    },
    onError: (error: any) => {
      console.error('Delete sale error:', error);
      toast.error('Failed to delete sale', {
        description: error.message || 'Please try again later'
      });
    },
  });
}
