import { useState, useEffect, useCallback, useMemo } from 'react';
import { optimizedSearchService, type SearchResult, type SearchFilters, type SearchSuggestion } from '@/services/core/OptimizedSearchService';

interface UseOptimizedSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  enableSuggestions?: boolean;
  autoSearch?: boolean;
  maxResults?: number;
}

interface UseOptimizedSearchReturn {
  // State
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setQuery: (query: string) => void;
  search: (searchQuery?: string, searchFilters?: SearchFilters) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
  
  // Computed
  hasResults: boolean;
  isEmpty: boolean;
  resultsByType: Record<string, SearchResult[]>;
}

/**
 * Comprehensive hook for optimized search functionality
 * Provides debounced search, suggestions, and result management
 */
export function useOptimizedSearch(
  filters: SearchFilters = {},
  options: UseOptimizedSearchOptions = {}
): UseOptimizedSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    enableSuggestions = true,
    autoSearch = true,
    maxResults = 20
  } = options;

  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized filters with defaults
  const searchFilters = useMemo(() => ({
    maxResults,
    ...filters
  }), [filters, maxResults]);

  // Search function
  const search = useCallback(async (searchQuery?: string, customFilters?: SearchFilters) => {
    const queryToSearch = searchQuery ?? query;
    const filtersToUse = customFilters ?? searchFilters;

    if (!queryToSearch.trim() || queryToSearch.length < minQueryLength) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchResults = await optimizedSearchService.debouncedSearch(
        queryToSearch,
        filtersToUse,
        debounceMs
      );
      setResults(searchResults);

      // Get suggestions if enabled
      if (enableSuggestions) {
        const searchSuggestions = await optimizedSearchService.getSuggestions(
          queryToSearch,
          10
        );
        setSuggestions(searchSuggestions);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, searchFilters, minQueryLength, debounceMs, enableSuggestions]);

  // Auto-search when query changes
  useEffect(() => {
    if (autoSearch && query.trim() && query.length >= minQueryLength) {
      search();
    } else if (query.length < minQueryLength) {
      setResults([]);
      setSuggestions([]);
    }
  }, [query, autoSearch, minQueryLength, search]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      optimizedSearchService.clearDebounceTimers();
    };
  }, []);

  // Clear functions
  const clearResults = useCallback(() => {
    setResults([]);
    setSuggestions([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed values
  const hasResults = results.length > 0;
  const isEmpty = !hasResults && !isLoading && query.length >= minQueryLength;
  
  const resultsByType = useMemo(() => {
    return results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, SearchResult[]>);
  }, [results]);

  return {
    // State
    query,
    results,
    suggestions,
    isLoading,
    error,
    
    // Actions
    setQuery,
    search,
    clearResults,
    clearError,
    
    // Computed
    hasResults,
    isEmpty,
    resultsByType
  };
}

/**
 * Simplified hook for quick search implementation
 */
export function useQuickSearch(entityTypes: ('brand' | 'model' | 'product')[] = ['brand', 'model']) {
  return useOptimizedSearch(
    { entityTypes },
    { 
      debounceMs: 200, 
      minQueryLength: 1,
      enableSuggestions: true,
      maxResults: 10 
    }
  );
}

/**
 * Hook specifically for product search with stock filtering
 */
export function useProductSearch(hasStock: boolean = true) {
  return useOptimizedSearch(
    { 
      entityTypes: ['product'], 
      hasStock 
    },
    { 
      debounceMs: 300,
      minQueryLength: 2,
      enableSuggestions: false,
      maxResults: 30
    }
  );
}