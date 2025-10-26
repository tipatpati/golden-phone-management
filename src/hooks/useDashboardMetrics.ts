import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  // Today's metrics
  today_sales_count: number;
  today_revenue: number;

  // Yesterday's metrics for comparison
  yesterday_sales_count: number;
  yesterday_revenue: number;

  // This week's metrics
  week_sales_count: number;
  week_revenue: number;

  // This month's metrics
  month_sales_count: number;
  month_revenue: number;

  // Repair metrics
  active_repairs_count: number;
  pending_repairs_count: number;

  // Inventory metrics
  low_stock_items_count: number;
  out_of_stock_items_count: number;

  // Client metrics
  new_clients_this_month: number;
  new_clients_last_month: number;
  total_active_clients: number;

  // Metadata
  generated_at: string;
}

/**
 * Optimized hook to fetch all dashboard metrics in a single database query
 *
 * PERFORMANCE: Reduces dashboard load from 8-10 queries to 1 query
 * Fetches <1KB of data instead of 8-50MB
 *
 * @returns React Query result with dashboard metrics
 */
export const useDashboardMetrics = () => {
  return useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_metrics');

      if (error) {
        console.error('Error fetching dashboard metrics:', error);
        throw new Error(error.message || 'Failed to fetch dashboard metrics');
      }

      if (!data) {
        throw new Error('No data returned from dashboard metrics query');
      }

      return data as DashboardMetrics;
    },
    staleTime: 30_000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60_000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    retry: 2, // Retry failed requests twice
  });
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): string => {
  if (previous === 0) {
    return current > 0 ? '+100' : '0';
  }

  const change = ((current - previous) / previous) * 100;
  return change >= 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
};
