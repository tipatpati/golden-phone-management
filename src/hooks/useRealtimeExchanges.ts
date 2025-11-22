/**
 * Real-Time Exchange Synchronization Hooks
 * Ensures instant UI updates when exchanges are created, updated, or cancelled
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Subscribe to real-time updates for all exchanges
 */
export function useRealtimeExchanges() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 [Exchanges] Setting up real-time subscriptions');

    const channel = supabase
      .channel('exchange_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchange_transactions'
        },
        (payload) => {
          console.log('🔄 [Exchanges] Exchange transaction changed:', payload.eventType, payload);
          
          // Invalidate all exchange-related queries
          queryClient.invalidateQueries({ queryKey: ['exchanges'] });
          queryClient.invalidateQueries({ queryKey: ['exchange-stats'] });
          
          // Also invalidate sales since exchanges can create sales
          queryClient.invalidateQueries({ queryKey: ['sales'] });
          queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
          
          // Invalidate inventory since trade-ins affect stock
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchange_trade_in_items'
        },
        (payload) => {
          console.log('🔄 [Exchanges] Trade-in item changed:', payload.eventType, payload);
          
          // Invalidate exchange queries
          queryClient.invalidateQueries({ queryKey: ['exchanges'] });
          
          // Invalidate inventory if product_id is involved
          if ((payload.new as any)?.product_id || (payload.old as any)?.product_id) {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [Exchanges] Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Subscribe to real-time updates for a specific exchange
 */
export function useRealtimeExchange(exchangeId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!exchangeId) return;

    console.log(`🔄 [Exchange] Setting up real-time subscription for exchange ${exchangeId}`);

    const channel = supabase
      .channel(`exchange_${exchangeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchange_transactions',
          filter: `id=eq.${exchangeId}`
        },
        (payload) => {
          console.log(`🔄 [Exchange] Exchange ${exchangeId} changed:`, payload.eventType);
          
          // Invalidate specific exchange query
          queryClient.invalidateQueries({ queryKey: ['exchange', exchangeId] });
          queryClient.invalidateQueries({ queryKey: ['exchanges'] });
        }
      )
      .subscribe();

    return () => {
      console.log(`🔄 [Exchange] Cleaning up subscription for exchange ${exchangeId}`);
      supabase.removeChannel(channel);
    };
  }, [exchangeId, queryClient]);
}

/**
 * Subscribe to real-time updates for exchange statistics
 */
export function useRealtimeExchangeStats() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 [Exchanges] Setting up real-time stats subscription');

    const channel = supabase
      .channel('exchange_stats')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'exchange_transactions'
        },
        (payload) => {
          console.log('🔄 [Exchanges] Exchange status changed, updating stats');
          queryClient.invalidateQueries({ queryKey: ['exchange-stats'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [Exchanges] Cleaning up stats subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
