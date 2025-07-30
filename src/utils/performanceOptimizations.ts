import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Debounced search hook for better performance
 */
export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 300
) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  const debouncedUpdate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (value: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setDebouncedSearchTerm(value), delay);
      };
    })(),
    [delay]
  );

  useEffect(() => {
    debouncedUpdate(searchTerm);
  }, [searchTerm, debouncedUpdate]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
  };
}

/**
 * Optimized list filtering with memoization
 */
export function useOptimizedFilter<T>(
  items: T[],
  searchTerm: string,
  filterFn: (item: T, searchTerm: string) => boolean,
  dependencies: any[] = []
) {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    return items.filter(item => filterFn(item, searchTerm.toLowerCase()));
  }, [items, searchTerm, ...dependencies]);
}

/**
 * Virtual scrolling hook for large lists
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 5, items.length); // 5 item buffer
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
    visibleRange,
  };
}

/**
 * Optimized table data processing
 */
export function useOptimizedTableData<T>(
  data: T[],
  searchTerm: string,
  sortKey?: keyof T,
  sortDirection: 'asc' | 'desc' = 'asc',
  filterFn?: (item: T, searchTerm: string) => boolean
) {
  return useMemo(() => {
    let processedData = [...data];

    // Filter
    if (searchTerm && filterFn) {
      processedData = processedData.filter(item => 
        filterFn(item, searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortKey) {
      processedData.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        
        if (aVal === bVal) return 0;
        
        const comparison = aVal > bVal ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return processedData;
  }, [data, searchTerm, sortKey, sortDirection, filterFn]);
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  threshold: number = 0.1,
  rootMargin: string = '0px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, threshold, rootMargin]);

  return { isIntersecting, setElement };
}

/**
 * Memory optimization for large datasets
 */
export function useMemoryOptimizedData<T>(
  data: T[],
  maxItems: number = 1000
) {
  return useMemo(() => {
    if (data.length <= maxItems) return data;
    
    // Keep most recent items
    return data.slice(-maxItems);
  }, [data, maxItems]);
}

/**
 * Create lazy-loaded component
 */
export function createLazyComponent<P = {}>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>
) {
  return React.lazy(importFn);
}
