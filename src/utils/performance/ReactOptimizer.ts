/**
 * React Performance Optimization Utilities
 * Provides utilities for optimizing React components and hooks
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { logger } from '@/utils/secureLogger';

export class ReactOptimizer {
  /**
   * Debounce utility for expensive operations
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle utility for frequent operations
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Memoize expensive computations
   */
  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Performance monitoring for component renders
   */
  static useRenderPerformance(componentName: string) {
    const renderStart = useRef<number>();
    const renderCount = useRef(0);
    
    // Start timing
    renderStart.current = performance.now();
    renderCount.current++;
    
    useEffect(() => {
      if (renderStart.current) {
        const renderTime = performance.now() - renderStart.current;
        
        if (renderTime > 16) { // More than one frame
          logger.warn('Slow component render detected', {
            component: componentName,
            renderTime: `${renderTime.toFixed(2)}ms`,
            renderCount: renderCount.current
          }, 'Performance');
        }
      }
    });
    
    return {
      renderCount: renderCount.current,
      getRenderTime: () => renderStart.current ? performance.now() - renderStart.current : 0
    };
  }

  /**
   * Optimized state setter that prevents unnecessary updates
   */
  static useOptimizedState<T>(initialState: T) {
    const [state, setState] = React.useState(initialState);
    const previousState = React.useRef<T>(initialState);
    
    const optimizedSetState = React.useCallback((newState: T | ((prev: T) => T)) => {
      setState(prev => {
        const nextState = typeof newState === 'function' 
          ? (newState as (prev: T) => T)(prev)
          : newState;
        
        // Deep comparison to prevent unnecessary updates
        if (JSON.stringify(nextState) === JSON.stringify(previousState.current)) {
          return prev;
        }
        
        previousState.current = nextState;
        return nextState;
      });
    }, []);
    
    return [state, optimizedSetState] as const;
  }

  /**
   * Memory-efficient array operations
   */
  static useStableArray<T>(array: T[], compareFn?: (a: T, b: T) => boolean): T[] {
    return React.useMemo(() => {
      if (compareFn) {
        return array.filter((item, index, arr) => 
          arr.findIndex(other => compareFn(item, other)) === index
        );
      }
      return Array.from(new Set(array));
    }, [array, compareFn]);
  }

  /**
   * Lazy loading utility for heavy components
   */
  static createLazyComponent<T extends Record<string, any>>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    fallback?: React.ComponentType
  ) {
    const LazyComponent = React.lazy(importFn);
    
    return (props: T) => React.createElement(
      React.Suspense,
      { fallback: fallback ? React.createElement(fallback) : React.createElement('div', {}, 'Loading...') },
      React.createElement(LazyComponent, props as any)
    );
  }

  /**
   * Virtualization helper for large lists
   */
  static useVirtualization<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number
  ) {
    const [scrollTop, setScrollTop] = useState(0);
    
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    const visibleItems = useMemo(() => 
      items.slice(visibleStart, visibleEnd).map((item, index) => ({
        item,
        index: visibleStart + index
      })),
      [items, visibleStart, visibleEnd]
    );
    
    const totalHeight = items.length * itemHeight;
    const offsetY = visibleStart * itemHeight;
    
    return {
      visibleItems,
      totalHeight,
      offsetY,
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
      }
    };
  }
}

/**
 * Hook for optimized event handlers
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Hook for stable object references
 */
export function useStableObject<T extends Record<string, any>>(obj: T): T {
  return useMemo(() => obj, [JSON.stringify(obj)]);
}

/**
 * Hook for cleanup on unmount
 */
export function useCleanup(cleanup: () => void) {
  useEffect(() => cleanup, []);
}