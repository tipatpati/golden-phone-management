import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SUPPLIER_TRANSACTION_KEYS } from '@/services/suppliers/SupplierTransactionService';
import { SupplierInventoryIntegrationService } from '@/services/suppliers/SupplierInventoryIntegrationService';
import { toast } from 'sonner';

export function useRealtimeTransactions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize supplier-inventory integration once
    SupplierInventoryIntegrationService.initialize();
    
    const channel = supabase
      .channel('supplier-transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'supplier_transactions'
        },
        (payload) => {
          console.log('New transaction:', payload);
          toast.success('New supplier transaction created');
          queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.all });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'supplier_transactions'
        },
        (payload) => {
          console.log('Transaction updated:', payload);
          const transaction = payload.new as any;
          if (transaction.status === 'completed') {
            toast.success(`Transaction ${transaction.transaction_number} completed`);
          } else if (transaction.status === 'cancelled') {
            toast.error(`Transaction ${transaction.transaction_number} cancelled`);
          }
          queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.all });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'supplier_transactions'
        },
        (payload) => {
          console.log('Transaction deleted:', payload);
          toast.info('Supplier transaction deleted');
          queryClient.invalidateQueries({ queryKey: SUPPLIER_TRANSACTION_KEYS.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      SupplierInventoryIntegrationService.cleanup();
    };
  }, [queryClient]);
}