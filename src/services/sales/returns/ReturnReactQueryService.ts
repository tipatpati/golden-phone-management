import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReturnApiService } from './ReturnApiService';
import type { CreateReturnData } from './types';
import { toast } from 'sonner';

const returnApiService = new ReturnApiService();

export const useReturns = () => {
  return useQuery({
    queryKey: ['returns'],
    queryFn: () => returnApiService.getAll(),
  });
};

export const useReturn = (returnId: string) => {
  return useQuery({
    queryKey: ['returns', returnId],
    queryFn: () => returnApiService.getById(returnId),
    enabled: !!returnId,
  });
};

export const useCreateReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateReturnData) => returnApiService.createReturn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_units'] });
      toast.success('Reso creato con successo');
    },
    onError: (error: Error) => {
      toast.error(`Errore creazione reso: ${error.message}`);
    },
  });
};

export const useCompleteReturn = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (returnId: string) => returnApiService.completeReturn(returnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      toast.success('Reso completato');
    },
    onError: (error: Error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });
};
