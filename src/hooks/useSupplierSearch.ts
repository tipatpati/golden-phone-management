import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { SupplierSearchService, type SupplierSearchResult } from '@/services/suppliers/SupplierSearchService';

export function useSupplierSearch(searchTerm: string) {
  const [results, setResults] = useState<SupplierSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.trim().length === 0) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await SupplierSearchService.search(debouncedSearchTerm);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm]);

  return {
    results,
    isSearching,
    hasResults: results.length > 0
  };
}
