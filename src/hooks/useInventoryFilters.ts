import { useState, useCallback, useEffect, useMemo } from 'react';

export type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type SerialFilter = 'all' | 'yes' | 'no';
export type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom';

export interface InventoryFilters {
  searchTerm: string;
  categoryId: number | 'all';
  stockStatus: StockStatus;
  hasSerial: SerialFilter;
  datePreset: DatePreset;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  year: number | 'all';
  sortBy: SortOption;
}

const DEFAULT_FILTERS: InventoryFilters = {
  searchTerm: '', // Never persisted - always starts empty
  categoryId: 'all',
  stockStatus: 'all',
  hasSerial: 'all',
  datePreset: 'all',
  year: 'all',
  sortBy: 'newest',
};

const STORAGE_KEY = 'inventory-filters';

export function useInventoryFilters() {
  const [filters, setFilters] = useState<InventoryFilters>(() => {
    // Load from localStorage (except searchTerm which always starts empty)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        if (parsed.dateRange) {
          if (parsed.dateRange.start) parsed.dateRange.start = new Date(parsed.dateRange.start);
          if (parsed.dateRange.end) parsed.dateRange.end = new Date(parsed.dateRange.end);
        }
        // Always reset searchTerm to empty on mount
        return { ...DEFAULT_FILTERS, ...parsed, searchTerm: '' };
      }
    } catch (error) {
      console.error('Failed to load filters from localStorage:', error);
    }
    return DEFAULT_FILTERS;
  });

  // Save to localStorage (except searchTerm which should never persist)
  useEffect(() => {
    try {
      const { searchTerm, ...persistedFilters } = filters;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedFilters));
    } catch (error) {
      console.error('Failed to save filters to localStorage:', error);
    }
  }, [filters]);

  // Calculate date range based on preset
  const effectiveDateRange = useMemo(() => {
    if (filters.datePreset === 'custom') {
      return filters.dateRange;
    }
    
    const now = new Date();
    const start = new Date();
    
    switch (filters.datePreset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case 'week':
        start.setDate(now.getDate() - 7);
        return { start, end: now };
      case 'month':
        start.setDate(now.getDate() - 30);
        return { start, end: now };
      case 'quarter':
        start.setDate(now.getDate() - 90);
        return { start, end: now };
      default:
        return undefined;
    }
  }, [filters.datePreset, filters.dateRange]);

  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  }, []);

  const setCategoryId = useCallback((categoryId: number | 'all') => {
    setFilters(prev => ({ ...prev, categoryId }));
  }, []);

  const setStockStatus = useCallback((stockStatus: StockStatus) => {
    setFilters(prev => ({ ...prev, stockStatus }));
  }, []);

  const setHasSerial = useCallback((hasSerial: SerialFilter) => {
    setFilters(prev => ({ ...prev, hasSerial }));
  }, []);

  const setDatePreset = useCallback((datePreset: DatePreset) => {
    setFilters(prev => ({ ...prev, datePreset }));
  }, []);

  const setCustomDateRange = useCallback((start?: Date, end?: Date) => {
    setFilters(prev => ({ 
      ...prev, 
      datePreset: 'custom',
      dateRange: { start, end }
    }));
  }, []);

  const setPriceRange = useCallback((min?: number, max?: number) => {
    setFilters(prev => ({ 
      ...prev, 
      priceRange: min !== undefined || max !== undefined ? { min, max } : undefined
    }));
  }, []);

  const setYear = useCallback((year: number | 'all') => {
    setFilters(prev => ({ ...prev, year }));
  }, []);

  const setSortBy = useCallback((sortBy: SortOption) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const clearFilter = useCallback((key: keyof InventoryFilters) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: DEFAULT_FILTERS[key]
    }));
  }, []);

  // Count active filters (excluding search and sort)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categoryId !== 'all') count++;
    if (filters.stockStatus !== 'all') count++;
    if (filters.hasSerial !== 'all') count++;
    if (filters.datePreset !== 'all') count++;
    if (filters.priceRange && (filters.priceRange.min !== undefined || filters.priceRange.max !== undefined)) count++;
    if (filters.year !== 'all') count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0 || filters.searchTerm.length > 0;

  return {
    filters,
    effectiveDateRange,
    setSearchTerm,
    setCategoryId,
    setStockStatus,
    setHasSerial,
    setDatePreset,
    setCustomDateRange,
    setPriceRange,
    setYear,
    setSortBy,
    clearFilters,
    clearFilter,
    activeFilterCount,
    hasActiveFilters,
  };
}
