import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Independent search state management hook with debouncing
 * Separates search from filters - search is an active query operation
 */
export function useInventorySearch() {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce input value (300ms delay)
  const debouncedInput = useDebounce(inputValue, 300);

  // Auto-execute search when debounced value changes
  useEffect(() => {
    const trimmedQuery = debouncedInput.trim();
    setSearchQuery(trimmedQuery);
    setSearchTrigger(prev => prev + 1);
    if (trimmedQuery) {
      setIsSearching(true);
    }
  }, [debouncedInput]);

  /**
   * Update search input (debounced execution)
   */
  const executeSearch = useCallback((query: string) => {
    setInputValue(query);
    if (query.trim()) {
      setIsSearching(true);
    }
  }, []);

  /**
   * Clear search completely
   */
  const clearSearch = useCallback(() => {
    setInputValue('');
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
