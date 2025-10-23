import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { debugLog } from '@/utils/debug';

/**
 * Real-time subscription hook for inventory/products table
 * Replaces polling with Supabase real-time updates
 *
 * Usage:
 * ```tsx
 * function InventoryPage() {
 *   useRealtimeInventory();
 *   const { data: products } = useProducts();
 *   // ...
 * }
 * ```
 */
export function useRealtimeInventory() {
  const queryClient = useQueryClient();

  useEffect(() => {
    debugLog('Setting up real-time subscription for inventory');

    // Subscribe to products table changes
    const productsChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          debugLog('Products table changed:', payload);

          // Invalidate products queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    // Subscribe to product_units table changes
    const unitsChannel = supabase
      .channel('product-units-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_units'
        },
        (payload) => {
          debugLog('Product units table changed:', payload);

          // Invalidate both products and units queries
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['product_units'] });
        }
      )
      .subscribe();

    // Subscribe to categories table changes
    const categoriesChannel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        (payload) => {
          debugLog('Categories table changed:', payload);

          // Invalidate categories queries
          queryClient.invalidateQueries({ queryKey: ['categories'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      debugLog('Cleaning up real-time inventory subscriptions');
      productsChannel.unsubscribe();
      unitsChannel.unsubscribe();
      categoriesChannel.unsubscribe();
    };
  }, [queryClient]);
}

/**
 * Real-time subscription hook for specific product
 *
 * Usage:
 * ```tsx
 * function ProductDetails({ productId }) {
 *   useRealtimeProduct(productId);
 *   const { data: product } = useProduct(productId);
 *   // ...
 * }
 * ```
 */
export function useRealtimeProduct(productId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!productId) return;

    debugLog('Setting up real-time subscription for product:', productId);

    const channel = supabase
      .channel(`product-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`
        },
        (payload) => {
          debugLog('Product changed:', payload);

          // Invalidate specific product query
          queryClient.invalidateQueries({ queryKey: ['products', productId] });
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    return () => {
      debugLog('Cleaning up real-time product subscription');
      channel.unsubscribe();
    };
  }, [productId, queryClient]);
}

/**
 * Real-time subscription hook for inventory statistics
 * Useful for dashboard and analytics
 *
 * Usage:
 * ```tsx
 * function InventoryDashboard() {
 *   useRealtimeInventoryStats();
 *   const { data: stats } = useInventoryStats();
 *   // ...
 * }
 * ```
 */
export function useRealtimeInventoryStats() {
  const queryClient = useQueryClient();

  useEffect(() => {
    debugLog('Setting up real-time subscription for inventory stats');

    // Listen to products table for stock changes
    const channel = supabase
      .channel('inventory-stats')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          // Only trigger on stock changes
          filter: 'stock=neq.old.stock'
        },
        (payload) => {
          debugLog('Stock level changed:', payload);

          // Invalidate inventory statistics queries
          queryClient.invalidateQueries({ queryKey: ['inventory_stats'] });
          queryClient.invalidateQueries({ queryKey: ['low_stock'] });
        }
      )
      .subscribe();

    return () => {
      debugLog('Cleaning up real-time inventory stats subscription');
      channel.unsubscribe();
    };
  }, [queryClient]);
}
