import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { advancedCacheManager } from '../services/core/AdvancedCacheManager';
import { logger } from '@/utils/logger';

/**
 * Hook options for optimized queries
 */
export interface OptimizedQueryOptions {
  enablePrefetching?: boolean;
  enableOptimisticUpdates?: boolean;
  enableBackground?: boolean;
  priority?: 'high' | 'normal' | 'low';
  dependencies?: string[];
  cacheTags?: string[];
  conflictResolution?: 'merge' | 'replace' | 'ignore';
}

/**
 * Enhanced hook for optimized query management with advanced caching
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions = {}
) {
  const queryClient = useQueryClient();
  const lastResultRef = useRef<T | null>(null);
  const conflictCountRef = useRef(0);

  const {
    enablePrefetching = true,
    enableOptimisticUpdates = true,
    enableBackground = false,
    priority = 'normal',
    dependencies = [],
    cacheTags = [],
    conflictResolution = 'merge'
  } = options;

  // Get optimized stale time based on priority and cache tags
  const getOptimizedStaleTime = useCallback(() => {
    const baseStaleTime = priority === 'high' ? 30000 : 
                         priority === 'normal' ? 60000 : 
                         300000; // 5 minutes for low priority

    // Adjust based on cache tags
    if (cacheTags.includes('static')) return 600000; // 10 minutes
    if (cacheTags.includes('dynamic')) return 10000; // 10 seconds
    if (cacheTags.includes('realtime')) return 5000; // 5 seconds

    return baseStaleTime;
  }, [priority, cacheTags]);

  // Enhanced query with optimizations
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const startTime = performance.now();
      
      try {
        const result = await queryFn();
        const endTime = performance.now();
        
        // Log performance metrics
        logger.debug('OptimizedQuery: Query completed', {
          queryKey: queryKey.join('.'),
          duration: endTime - startTime,
          priority,
          cacheTags
        });

        // Conflict detection and resolution
        if (lastResultRef.current && enableOptimisticUpdates) {
          const hasConflict = await detectDataConflict(lastResultRef.current, result);
          
          if (hasConflict) {
            conflictCountRef.current++;
            const resolvedResult = await resolveConflict(
              lastResultRef.current,
              result,
              conflictResolution
            );
            
            logger.warn('OptimizedQuery: Data conflict detected and resolved', {
              queryKey: queryKey.join('.'),
              conflictCount: conflictCountRef.current,
              resolution: conflictResolution
            });
            
            lastResultRef.current = resolvedResult;
            return resolvedResult;
          }
        }

        lastResultRef.current = result;
        return result;

      } catch (error) {
        logger.error('OptimizedQuery: Query failed', {
          queryKey: queryKey.join('.'),
          error,
          priority
        });
        throw error;
      }
    },
    staleTime: getOptimizedStaleTime(),
    gcTime: getOptimizedStaleTime() * 2, // gcTime replaces cacheTime in newer versions
    refetchOnWindowFocus: priority === 'high',
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      const maxRetries = priority === 'high' ? 3 : priority === 'normal' ? 2 : 1;
      return failureCount < maxRetries && !isNonRetryableError(error);
    },
    retryDelay: (attemptIndex) => {
      const baseDelay = priority === 'high' ? 500 : 1000;
      return Math.min(baseDelay * Math.pow(2, attemptIndex), 10000);
    }
  });

  // Prefetching for dependent queries
  useEffect(() => {
    if (enablePrefetching && dependencies.length > 0 && query.data) {
      const prefetchDependencies = async () => {
        for (const dep of dependencies) {
          try {
            await queryClient.prefetchQuery({
              queryKey: [dep],
              queryFn: () => Promise.resolve(null), // Placeholder
              staleTime: getOptimizedStaleTime()
            });
          } catch (error) {
            logger.debug('OptimizedQuery: Dependency prefetch failed', { 
              dependency: dep, 
              error 
            });
          }
        }
      };

      prefetchDependencies();
    }
  }, [query.data, dependencies, enablePrefetching, queryClient, getOptimizedStaleTime]);

  // Background refresh for high-priority queries
  useEffect(() => {
    if (enableBackground && priority === 'high') {
      const interval = setInterval(() => {
        if (!query.isFetching) {
          queryClient.refetchQueries({ 
            queryKey, 
            type: 'inactive' 
          });
        }
      }, 60000); // 1 minute

      return () => clearInterval(interval);
    }
  }, [enableBackground, priority, query.isFetching, queryClient, queryKey]);

  return {
    ...query,
    optimizedStaleTime: getOptimizedStaleTime(),
    conflictCount: conflictCountRef.current,
    priority,
    cacheTags
  };
}

/**
 * Hook for batch operations with optimized caching
 */
export function useBatchOptimizedQueries<T>(
  queries: Array<{
    queryKey: string[];
    queryFn: () => Promise<T>;
    options?: OptimizedQueryOptions;
  }>
) {
  const queryClient = useQueryClient();
  const results = new Map<string, any>();

  // Execute queries with intelligent batching
  queries.forEach(({ queryKey, queryFn, options = {} }) => {
    const key = queryKey.join('.');
    const result = useOptimizedQuery(queryKey, queryFn, options);
    results.set(key, result);
  });

  // Batch invalidation helper
  const batchInvalidate = useCallback(async (patterns: string[]) => {
    const invalidationPromises = patterns.map(pattern => 
      queryClient.invalidateQueries({
        predicate: (query) => 
          query.queryKey.some(key => 
            typeof key === 'string' && key.includes(pattern)
          )
      })
    );

    await Promise.all(invalidationPromises);
    
    logger.debug('BatchOptimizedQueries: Batch invalidation completed', { patterns });
  }, [queryClient]);

  // Batch prefetch helper
  const batchPrefetch = useCallback(async (queryKeys: string[][]) => {
    const prefetchPromises = queryKeys.map(queryKey =>
      queryClient.prefetchQuery({
        queryKey,
        queryFn: () => Promise.resolve(null), // Would be actual query function
        staleTime: 60000
      })
    );

    await Promise.allSettled(prefetchPromises);
    
    logger.debug('BatchOptimizedQueries: Batch prefetch completed', { 
      queryCount: queryKeys.length 
    });
  }, [queryClient]);

  return {
    results: Object.fromEntries(results),
    batchInvalidate,
    batchPrefetch,
    isLoading: Array.from(results.values()).some(r => r.isLoading),
    isError: Array.from(results.values()).some(r => r.isError),
    errors: Array.from(results.values())
      .filter(r => r.error)
      .map(r => r.error)
  };
}

/**
 * Hook for intelligent query invalidation with dependency tracking
 */
export function useSmartInvalidation() {
  const queryClient = useQueryClient();

  const invalidateWithDependencies = useCallback(async (
    queryKey: string[],
    options: {
      includeDependents?: boolean;
      includeDependendies?: boolean;
      deep?: boolean;
    } = {}
  ) => {
    const { includeDependents = true, includeDependendies = true, deep = false } = options;

    try {
      // Invalidate primary query
      await queryClient.invalidateQueries({ queryKey });

      if (includeDependents || includeDependendies) {
        const cacheStats = advancedCacheManager.getCacheStatistics();
        const dependencies = cacheStats?.dependencies || [];

        // Find related queries based on dependency graph
        const relatedQueries = new Set<string>();
        const primaryKey = queryKey[0];

        dependencies.forEach(([source, deps]: [string, any[]]) => {
          if (source === primaryKey && includeDependents) {
            deps.forEach(dep => dep.targets?.forEach((target: string) => 
              relatedQueries.add(target)
            ));
          }
          
          if (includeDependendies) {
            deps.forEach(dep => {
              if (dep.targets?.includes(primaryKey)) {
                relatedQueries.add(source);
              }
            });
          }
        });

        // Invalidate related queries
        const invalidationPromises = Array.from(relatedQueries).map(relatedKey =>
          queryClient.invalidateQueries({ queryKey: [relatedKey] })
        );

        await Promise.all(invalidationPromises);

        logger.debug('SmartInvalidation: Completed with dependencies', {
          primaryKey,
          relatedQueries: Array.from(relatedQueries),
          deep
        });
      }

    } catch (error) {
      logger.error('SmartInvalidation: Failed', { queryKey, error });
    }
  }, [queryClient]);

  const invalidateByPattern = useCallback(async (pattern: string) => {
    await queryClient.invalidateQueries({
      predicate: (query) => 
        query.queryKey.some(key => 
          typeof key === 'string' && key.includes(pattern)
        )
    });

    logger.debug('SmartInvalidation: Pattern invalidation completed', { pattern });
  }, [queryClient]);

  const invalidateByTags = useCallback(async (tags: string[]) => {
    for (const tag of tags) {
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryTags = (query.meta as any)?.tags || [];
          return queryTags.includes(tag);
        }
      });
    }

    logger.debug('SmartInvalidation: Tag invalidation completed', { tags });
  }, [queryClient]);

  return {
    invalidateWithDependencies,
    invalidateByPattern,
    invalidateByTags
  };
}

/**
 * Hook for cache performance monitoring
 */
export function useCachePerformance() {
  const queryClient = useQueryClient();

  const getPerformanceMetrics = useCallback(() => {
    return advancedCacheManager.getCacheStatistics();
  }, []);

  const warmCriticalQueries = useCallback(async (categories?: string[]) => {
    await advancedCacheManager.warmCache(categories);
  }, []);

  const forceCacheRefresh = useCallback(async (queryKeys: string[][]) => {
    await advancedCacheManager.forceRefresh(queryKeys);
  }, []);

  const optimizeCache = useCallback(async () => {
    const stats = getPerformanceMetrics();
    
    if (stats?.performance?.hitRatio < 0.8) {
      // Low hit ratio - warm popular queries
      await warmCriticalQueries(['inventory', 'sales']);
    }

    if (stats?.performance?.memoryUsage > 50 * 1024 * 1024) { // 50MB
      // High memory usage - trigger cleanup
      await queryClient.clear();
      logger.info('CachePerformance: Cache cleared due to high memory usage');
    }

    logger.debug('CachePerformance: Cache optimization completed');
  }, [getPerformanceMetrics, warmCriticalQueries, queryClient]);

  return {
    getPerformanceMetrics,
    warmCriticalQueries,
    forceCacheRefresh,
    optimizeCache
  };
}

/**
 * Utility functions for conflict resolution
 */
async function detectDataConflict<T>(oldData: T, newData: T): Promise<boolean> {
  try {
    // Simple timestamp-based conflict detection
    const oldTimestamp = (oldData as any)?.updated_at || (oldData as any)?.timestamp;
    const newTimestamp = (newData as any)?.updated_at || (newData as any)?.timestamp;

    if (oldTimestamp && newTimestamp) {
      return new Date(oldTimestamp) > new Date(newTimestamp);
    }

    // Fallback to deep comparison for non-timestamped data
    return JSON.stringify(oldData) !== JSON.stringify(newData);

  } catch (error) {
    logger.error('Conflict detection failed', error);
    return false;
  }
}

async function resolveConflict<T>(
  oldData: T,
  newData: T,
  strategy: 'merge' | 'replace' | 'ignore'
): Promise<T> {
  switch (strategy) {
    case 'merge':
      if (typeof oldData === 'object' && typeof newData === 'object') {
        return { ...oldData, ...newData };
      }
      return newData;
    
    case 'replace':
      return newData;
    
    case 'ignore':
      return oldData;
    
    default:
      return newData;
  }
}

function isNonRetryableError(error: any): boolean {
  const status = error?.status || error?.response?.status;
  return status === 404 || status === 403 || status === 401;
}