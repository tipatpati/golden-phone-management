import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Lightweight search hook with minimal overhead
 * Reduces debounce delay and simplifies state management
 */
export function useLightweightSearch(initialSearchTerm = '', debounceMs = 150) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  
  // Simple search state without complex loading indicators
  const isSearching = useMemo(
    () => searchTerm !== debouncedSearchTerm && searchTerm.trim() !== '',
    [searchTerm, debouncedSearchTerm]
  );

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    clearSearch,
  };
}

/**
 * Simple filter hook without complex memoization overhead
 */
export function useSimpleFilter<T>(
  items: T[],
  searchTerm: string,
  filterFn: (item: T, searchTerm: string) => boolean
) {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter(item => filterFn(item, lowerSearchTerm));
  }, [items, searchTerm, filterFn]);
}

/**
 * Lightweight pagination without virtual scrolling complexity
 */
export function useSimplePagination<T>(items: T[], pageSize = 50) {
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = items.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  }, []);

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(0);
  }, [items.length]);

  return {
    currentPage,
    totalPages,
    currentItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages - 1,
    hasPrev: currentPage > 0,
  };
}