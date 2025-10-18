import { useState, useCallback } from 'react';

/**
 * Independent search state management hook for supplier transactions
 * Separates search from filters - search is an active query operation
 */
export function useSupplierTransactionSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Execute search - increments trigger to force refetch
   */
  const executeSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim();
    setSearchQuery(trimmedQuery);
    setSearchTrigger(prev => prev + 1);
    setIsSearching(true);
  }, []);

  /**
   * Clear search completely
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchTrigger(prev => prev + 1);
    setIsSearching(false);
  }, []);

  /**
   * Mark search as completed (called after refetch completes)
   */
  const completeSearch = useCallback(() => {
    setIsSearching(false);
  }, []);

  return {
    searchQuery,
    searchTrigger,
    isSearching,
    executeSearch,
    clearSearch,
    completeSearch,
  };
}
