import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function usePerformanceMonitor() {
  const queryClient = useQueryClient();

  // Monitor and clean up stale queries
  useEffect(() => {
    const cleanup = setInterval(() => {
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();
      
      // Remove queries that haven't been used in 30 minutes
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      
      queries.forEach(query => {
        if (query.state.dataUpdatedAt < thirtyMinutesAgo && !query.getObserversCount()) {
          queryCache.remove(query);
        }
      });
    }, 10 * 60 * 1000); // Run every 10 minutes

    return () => clearInterval(cleanup);
  }, [queryClient]);

  // Performance monitoring for slow operations
  const measurePerformance = useCallback((label: string, fn: () => any) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (end - start > 100) { // Log operations taking more than 100ms
      console.warn(`Slow operation detected: ${label} took ${end - start}ms`);
    }
    
    return result;
  }, []);

  return { measurePerformance };
}