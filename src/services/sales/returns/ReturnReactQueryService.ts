import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReturnApiService } from './ReturnApiService';
import { SalesExchangeService } from './SalesExchangeService';
import type { CreateReturnData } from './types';
import type { CreateExchangeData } from './SalesExchangeService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

export const useSaleReturns = (saleId: string) => {
  return useQuery({
    queryKey: ['returns', 'sale', saleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sale_returns')
        .select(`
          *,
          return_items:sale_return_items(
            id, quantity, return_condition, refund_amount,
            product:products(brand, model)
          ),
          returned_by_user:profiles!returned_by(username)
        `)
        .eq('sale_id', saleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!saleId,
  });
};

export const useReturnEligibility = (saleId: string) => {
  return useQuery({
    queryKey: ['returns', 'eligibility', saleId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_return_eligibility', {
        p_sale_id: saleId
      });

      if (error) throw error;
      return data;
    },
    enabled: !!saleId,
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

export const useCreateExchange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExchangeData) => SalesExchangeService.createExchange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_units'] });
      toast.success('Cambio completato con successo');
    },
    onError: (error: Error) => {
      toast.error(`Errore cambio: ${error.message}`);
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

