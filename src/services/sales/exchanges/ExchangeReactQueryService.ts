/**
 * React Query Hooks for Exchange Transactions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExchangeTransactionService } from './ExchangeTransactionService';
import type { CreateExchangeData, ExchangeFilters } from './types';
import { toast } from 'sonner';

/**
 * Fetch all exchanges
 */
export function useExchanges(filters?: ExchangeFilters) {
  return useQuery({
    queryKey: ['exchanges', filters],
    queryFn: () => ExchangeTransactionService.getExchanges(filters),
  });
}

/**
 * Fetch single exchange details
 */
export function useExchange(id: string | null) {
  return useQuery({
    queryKey: ['exchanges', id],
    queryFn: () => {
      if (!id) throw new Error('Exchange ID is required');
      return ExchangeTransactionService.getExchangeDetails(id);
    },
    enabled: !!id,
  });
}

/**
 * Create new exchange transaction
 */
export function useCreateExchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExchangeData) =>
      ExchangeTransactionService.createExchange(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
      
      toast.success('Cambio creato con successo!', {
        description: `Numero cambio: ${result.exchange_number}`,
      });
    },
    onError: (error: Error) => {
      console.error('Exchange creation error:', error);
      toast.error('Errore nella creazione del cambio', {
        description: error.message,
      });
    },
  });
}

/**
 * Cancel exchange
 */
export function useCancelExchange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ExchangeTransactionService.cancelExchange(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast.success('Cambio annullato con successo');
    },
    onError: (error: Error) => {
      console.error('Exchange cancellation error:', error);
      toast.error('Errore nell\'annullamento del cambio', {
        description: error.message,
      });
    },
  });
}
