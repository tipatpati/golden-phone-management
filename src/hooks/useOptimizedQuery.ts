import { useQuery, useQueryClient } from "@tanstack/react-query";

// Optimized React Query configuration for better performance
export const queryConfig = {
  // Global defaults for better performance
  staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
  gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (renamed from cacheTime)
  refetchOnWindowFocus: false, // Reduce unnecessary refetches
  refetchOnMount: true,
  retry: (failureCount: number, error: any) => {
    // Smart retry logic
    if (error?.status === 404 || error?.status === 403) return false;
    return failureCount < 2;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Specific configurations for different data types
export const dataQueryConfigs = {
  // Fast-changing data (sales, real-time updates)
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  },
  
  // Moderately changing data (inventory, clients)
  moderate: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  
  // Rarely changing data (categories, settings)
  static: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  }
};

// Custom hook for optimized queries
export function useOptimizedQuery<T>(
  key: readonly string[] | string[], 
  queryFn: () => Promise<T>,
  config: 'realtime' | 'moderate' | 'static' = 'moderate'
) {
  return useQuery({
    queryKey: key,
    queryFn,
    ...queryConfig,
    ...dataQueryConfigs[config],
  });
}

// Pagination helper
export interface PaginationConfig {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function usePaginatedQuery<T>(
  key: string[],
  queryFn: (config: PaginationConfig) => Promise<{ data: T[]; total: number }>,
  pagination: PaginationConfig,
  config: 'realtime' | 'moderate' | 'static' = 'moderate'
) {
  return useQuery({
    queryKey: [...key, pagination],
    queryFn: () => queryFn(pagination),
    ...queryConfig,
    ...dataQueryConfigs[config],
    placeholderData: (previousData) => previousData, // Updated API for keeping previous data
  });
}