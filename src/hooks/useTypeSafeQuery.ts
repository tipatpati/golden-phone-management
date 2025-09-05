import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

// Type-safe wrapper for queries that ensures proper data typing
export function useTypeSafeQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    queryKey: readonly unknown[];
    queryFn: () => Promise<TData>;
  }
): UseQueryResult<TData, TError> & { data: TData | undefined } {
  return useQuery<TData, TError>(options);
}

// Helper to ensure array data is properly typed
export function ensureArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }
  return [];
}

// Helper to ensure data exists and is properly typed
export function ensureData<T>(data: unknown, fallback: T): T {
  if (data !== undefined && data !== null) {
    return data as T;
  }
  return fallback;
}