import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSales } from '@/services/sales/SalesReactQueryService';

/**
 * Hook for debounced sales search with loading states
 */
export function useDebouncedSalesSearch(initialSearchTerm: string = '') {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const salesQuery = useSales(debouncedSearchTerm);
  
  // Determine if we're in a loading state due to search
  const isSearching = searchTerm !== debouncedSearchTerm && searchTerm.trim() !== '';
  
  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    sales: Array.isArray(salesQuery.data) ? salesQuery.data : [],
    isLoading: salesQuery.isLoading,
    isSearching,
    error: salesQuery.error,
    refetch: salesQuery.refetch
  };
}