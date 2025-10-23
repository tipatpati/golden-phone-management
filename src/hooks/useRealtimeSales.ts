import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debugLog } from '@/utils/debug';

/**
 * Real-time subscription hook for sales table
 * Replaces polling with Supabase real-time updates
 *
 * Usage:
 * ```tsx
 * function SalesPage() {
 *   useRealtimeSales();
 *   const { data: sales } = useSales();
 *   // ...
 * }
 * ```
 */
export function useRealtimeSales() {
  const queryClient = useQueryClient();

  useEffect(() => {
    debugLog('Setting up real-time subscription for sales');

    // Subscribe to sales table changes
    const salesChannel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          debugLog('Sales table changed:', payload);

          // Invalidate sales queries
          queryClient.invalidateQueries({ queryKey: ['sales'] });
          queryClient.invalidateQueries({ queryKey: ['sales_stats'] });

          // Also invalidate inventory since sales affect stock
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
        }
      )
      .subscribe();

    // Subscribe to sale_items table changes
    const saleItemsChannel = supabase
      .channel('sale-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sale_items'
        },
        (payload) => {
          debugLog('Sale items table changed:', payload);

          // Invalidate sales queries
          queryClient.invalidateQueries({ queryKey: ['sales'] });

          // Invalidate specific sale if we have the sale_id
          if (payload.new && 'sale_id' in payload.new) {
            queryClient.invalidateQueries({
              queryKey: ['sales', payload.new.sale_id]
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      debugLog('Cleaning up real-time sales subscriptions');
      salesChannel.unsubscribe();
      saleItemsChannel.unsubscribe();
    };
  }, [queryClient]);
}

/**
 * Real-time subscription hook for specific sale
 *
 * Usage:
 * ```tsx
 * function SaleDetails({ saleId }) {
 *   useRealtimeSale(saleId);
 *   const { data: sale } = useSale(saleId);
 *   // ...
 * }
 * ```
 */
export function useRealtimeSale(saleId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!saleId) return;

    debugLog('Setting up real-time subscription for sale:', saleId);

    const channel = supabase
      .channel(`sale-${saleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `id=eq.${saleId}`
        },
        (payload) => {
          debugLog('Sale changed:', payload);

          // Invalidate specific sale query
          queryClient.invalidateQueries({ queryKey: ['sales', saleId] });
          queryClient.invalidateQueries({ queryKey: ['sales'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sale_items',
          filter: `sale_id=eq.${saleId}`
        },
        (payload) => {
          debugLog('Sale items changed for sale:', saleId, payload);

          // Invalidate specific sale query
          queryClient.invalidateQueries({ queryKey: ['sales', saleId] });
        }
      )
      .subscribe();

    return () => {
      debugLog('Cleaning up real-time sale subscription');
      channel.unsubscribe();
    };
  }, [saleId, queryClient]);
}

/**
 * Real-time subscription hook for client sales
 * Useful for client details view
 *
 * Usage:
 * ```tsx
 * function ClientDetails({ clientId }) {
 *   useRealtimeClientSales(clientId);
 *   const { data: sales } = useClientSales(clientId);
 *   // ...
 * }
 * ```
 */
export function useRealtimeClientSales(clientId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!clientId) return;

    debugLog('Setting up real-time subscription for client sales:', clientId);

    const channel = supabase
      .channel(`client-sales-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          debugLog('Client sales changed:', payload);

          // Invalidate client sales queries
          queryClient.invalidateQueries({ queryKey: ['sales', 'client', clientId] });
          queryClient.invalidateQueries({ queryKey: ['clients', clientId] });
        }
      )
      .subscribe();

    return () => {
      debugLog('Cleaning up real-time client sales subscription');
      channel.unsubscribe();
    };
  }, [clientId, queryClient]);
}

/**
 * Real-time subscription hook for sales analytics
 * Useful for dashboard and reporting
 *
 * Usage:
 * ```tsx
 * function SalesDashboard() {
 *   useRealtimeSalesAnalytics();
 *   const { data: analytics } = useSalesAnalytics();
 *   // ...
 * }
 * ```
 */
export function useRealtimeSalesAnalytics() {
  const queryClient = useQueryClient();

  useEffect(() => {
    debugLog('Setting up real-time subscription for sales analytics');

    const channel = supabase
      .channel('sales-analytics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          debugLog('Sales changed, updating analytics:', payload);

          // Invalidate analytics queries
          queryClient.invalidateQueries({ queryKey: ['sales_stats'] });
          queryClient.invalidateQueries({ queryKey: ['sales_analytics'] });
          queryClient.invalidateQueries({ queryKey: ['revenue_stats'] });
          queryClient.invalidateQueries({ queryKey: ['sales', 'recent'] });
        }
      )
      .subscribe();

    return () => {
      debugLog('Cleaning up real-time sales analytics subscription');
      channel.unsubscribe();
    };
  }, [queryClient]);
}
