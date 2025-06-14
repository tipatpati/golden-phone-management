
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseClientApi } from './supabaseClients';
import { toast } from '@/components/ui/sonner';

export type { Client } from './supabaseClients';

export function useClients(searchTerm: string = '') {
  return useQuery({
    queryKey: ['clients', searchTerm],
    queryFn: () => supabaseClientApi.getClients(searchTerm),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => supabaseClientApi.getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supabaseClientApi.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
    },
    onError: (error: any) => {
      console.error('Create client error:', error);
      toast.error('Failed to create client', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, client }: { id: string, client: any }) => 
      supabaseClientApi.updateClient(id, client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
    },
    onError: (error: any) => {
      console.error('Update client error:', error);
      toast.error('Failed to update client', {
        description: error.message || 'Please try again later'
      });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: supabaseClientApi.deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
    },
    onError: (error: any) => {
      console.error('Delete client error:', error);
      toast.error('Failed to delete client', {
        description: error.message || 'Please try again later'
      });
    },
  });
}
