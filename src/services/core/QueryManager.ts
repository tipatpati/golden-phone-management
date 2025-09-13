/**
 * Simple Query Cache for Phase 2 Implementation
 * Basic caching without complex dependencies
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/utils/secureLogger';
import { LoadingState, AsyncState } from '@/types/global';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// Simple in-memory cache
const simpleCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

interface QueryOptions<T> {
  queryKey: string;
  queryFn: () => Promise<T>;
  cacheTime?: number;
  staleTime?: number;
  retry?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface QueryState<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
  isFetching: boolean;
  isStale: boolean;
}

/**
 * Simple query hook with basic caching
 */
export function useQuery<T>(options: QueryOptions<T>) {
  const {
    queryKey,
    queryFn,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 30 * 1000, // 30 seconds
    retry = 3,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: 'idle',
    error: null,
    isFetching: false,
    isStale: false
  });

  const { handleError } = useErrorHandler({ context: 'useQuery' });
  const mountedRef = useRef(true);

  // Check cache
  const getCachedData = useCallback(() => {
    const cached = simpleCache.get(queryKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      const isStale = Date.now() - cached.timestamp > staleTime;
      return { data: cached.data, isStale };
    }
    return null;
  }, [queryKey, staleTime]);

  // Execute query
  const executeQuery = useCallback(async (): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const result = await queryFn();
        
        // Cache result
        simpleCache.set(queryKey, {
          data: result,
          timestamp: Date.now(),
          ttl: cacheTime
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retry) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError!;
  }, [queryKey, queryFn, retry, cacheTime]);

  // Fetch data
  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first unless forced
    if (!force) {
      const cached = getCachedData();
      if (cached && !cached.isStale) {
        setState(prev => ({
          ...prev,
          data: cached.data,
          loading: 'success',
          error: null,
          isStale: cached.isStale
        }));
        onSuccess?.(cached.data);
        return;
      }
    }

    setState(prev => ({
      ...prev,
      loading: 'loading',
      isFetching: true,
      error: null
    }));

    try {
      const data = await executeQuery();
      
      if (!mountedRef.current) return;

      setState(prev => ({
        ...prev,
        data,
        loading: 'success',
        error: null,
        isFetching: false,
        isStale: false
      }));

      onSuccess?.(data);
    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState(prev => ({
        ...prev,
        loading: 'error',
        error: errorMessage,
        isFetching: false
      }));

      onError?.(error as Error);
      handleError(error, `Query failed: ${queryKey}`);
    }
  }, [enabled, getCachedData, executeQuery, queryKey, onSuccess, onError, handleError]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(() => fetchData(true), [fetchData]);
  
  const invalidate = useCallback(() => {
    simpleCache.delete(queryKey);
    setState(prev => ({ ...prev, isStale: true }));
  }, [queryKey]);

  return {
    ...state,
    refetch,
    invalidate,
    isLoading: state.loading === 'loading',
    isError: state.loading === 'error',
    isSuccess: state.loading === 'success',
    isIdle: state.loading === 'idle'
  };
}

/**
 * Simple mutation hook
 */
export function useMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
  } = {}
) {
  const [state, setState] = useState<AsyncState<TData>>({
    data: null,
    loading: 'idle',
    error: null
  });

  const { handleError } = useErrorHandler({ context: 'useMutation' });

  const mutate = useCallback(async (variables: TVariables) => {
    setState(prev => ({ ...prev, loading: 'loading', error: null }));

    try {
      const data = await mutationFn(variables);
      
      setState(prev => ({ ...prev, data, loading: 'success' }));
      options.onSuccess?.(data, variables);
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Mutation failed';
      
      setState(prev => ({ ...prev, loading: 'error', error: errorMessage }));
      options.onError?.(error as Error, variables);
      
      handleError(error, 'Mutation failed');
      throw error;
    }
  }, [mutationFn, options, handleError]);

  const reset = useCallback(() => {
    setState({ data: null, loading: 'idle', error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
    isLoading: state.loading === 'loading',
    isError: state.loading === 'error',
    isSuccess: state.loading === 'success',
    isIdle: state.loading === 'idle'
  };
}

// Cache utilities
export const invalidateQueries = (pattern: string) => {
  for (const key of simpleCache.keys()) {
    if (key.includes(pattern)) {
      simpleCache.delete(key);
    }
  }
  logger.debug('Invalidated queries', { pattern }, 'QueryManager');
};

export const clearAllQueries = () => {
  simpleCache.clear();
  logger.debug('Cleared all queries', {}, 'QueryManager');
};