import { useState, useCallback, useEffect, useMemo } from 'react';

export type StockStatus = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type SerialFilter = 'all' | 'yes' | 'no';
export type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc';
export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom';

export interface InventoryFilters {
  categoryId: number | 'all';
  stockStatus: StockStatus;
  hasSerial: SerialFilter;
  searchTerm: string;
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
  categoryId: 'all',
  stockStatus: 'all',
  hasSerial: 'all',
  searchTerm: '',
  datePreset: 'all',
  year: 'all',
  sortBy: 'newest',
};

const STORAGE_KEY = 'inventory-filters';

export function useInventoryFilters() {
  const [filters, setFilters] = useState<InventoryFilters>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dateRange) {
          if (parsed.dateRange.start) parsed.dateRange.start = new Date(parsed.dateRange.start);
          if (parsed.dateRange.end) parsed.dateRange.end = new Date(parsed.dateRange.end);
        }
        return { ...DEFAULT_FILTERS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load filters from localStorage:', error);
    }
    return DEFAULT_FILTERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save filters to localStorage:', error);
    }
  }, [filters]);

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

  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.categoryId !== 'all') count++;
    if (filters.stockStatus !== 'all') count++;
    if (filters.hasSerial !== 'all') count++;
    if (filters.searchTerm.trim()) count++;
    if (filters.datePreset !== 'all') count++;
    if (filters.priceRange && (filters.priceRange.min !== undefined || filters.priceRange.max !== undefined)) count++;
    if (filters.year !== 'all') count++;
    return count;
  }, [filters]);

  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    effectiveDateRange,
    setCategoryId,
    setStockStatus,
    setHasSerial,
    setSearchTerm,
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
