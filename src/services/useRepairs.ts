
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseRepairsApi } from './supabaseRepairs';
import { toast } from '@/components/ui/sonner';

export type { Repair, RepairPart } from './supabaseRepairs';

export function useRepairs(searchTerm: string = '') {
  return useQuery({
    queryKey: ['repairs', searchTerm],
    queryFn: () => supabaseRepairsApi.getRepairs(searchTerm),
  });
}

export function useRepair(id: string) {
  return useQuery({
    queryKey: ['repair', id],
    queryFn: () => supabaseRepairsApi.getRepair(id),
    enabled: !!id,
  });
}

export function useCreateRepair() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supabaseRepairsApi.createRepair,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      toast.success('Repair created successfully');
    },
    onError: (error: any) => {
      console.error('Create repair error:', error);
      toast.error('Failed to create repair', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useUpdateRepair() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, repair }: { id: string, repair: any }) => 
      supabaseRepairsApi.updateRepair(id, repair),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      toast.success('Repair updated successfully');
    },
    onError: (error: any) => {
      console.error('Update repair error:', error);
      toast.error('Failed to update repair', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useDeleteRepair() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supabaseRepairsApi.deleteRepair,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      toast.success('Repair deleted successfully');
    },
    onError: (error: any) => {
      console.error('Delete repair error:', error);
      toast.error('Failed to delete repair', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useTechnicians() {
  return useQuery({
    queryKey: ['technicians'],
    queryFn: supabaseRepairsApi.getTechnicians,
  });
}
