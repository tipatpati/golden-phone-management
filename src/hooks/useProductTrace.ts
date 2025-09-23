import { useQuery } from '@tanstack/react-query';
import { ProductTracingService } from '@/services/tracing/ProductTracingService';
import { ProductTraceResult } from '@/services/tracing/types';

export function useProductTrace(serialNumber: string | null) {
  return useQuery({
    queryKey: ['product-trace', serialNumber],
    queryFn: () => ProductTracingService.traceProductBySerial(serialNumber!),
    enabled: !!serialNumber && serialNumber.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry if product not found
      if (error.message?.includes('not found')) return false;
      return failureCount < 2;
    },
  });
}

export function useSerialSuggestions(query: string) {
  return useQuery({
    queryKey: ['serial-suggestions', query],
    queryFn: () => ProductTracingService.searchSerialSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  });
}