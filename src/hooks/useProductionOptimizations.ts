/**
 * Production optimization hooks
 */

import { useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { env } from '@/config/environment';
import { performanceMonitoring } from '@/utils/buildOptimization';

/**
 * Hook for component performance monitoring
 */
export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const cleanup = performanceMonitoring.measureRender(componentName);
    return cleanup;
  }, [componentName]);
  
  const logSlowOperation = useCallback((operationName: string, duration: number) => {
    if (duration > 100) { // Operations taking more than 100ms
      logger.warn('Slow operation detected', {
        component: componentName,
        operation: operationName,
        duration: `${duration.toFixed(2)}ms`
      }, 'Performance');
    }
  }, [componentName]);
  
  return { logSlowOperation };
}

/**
 * Hook for memory optimization
 */
export function useMemoryOptimization() {
  useEffect(() => {
    if (!env.IS_PRODUCTION) {
      performanceMonitoring.monitorMemory();
      
      const interval = setInterval(() => {
        performanceMonitoring.monitorMemory();
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, []);
}

/**
 * Hook for debounced operations
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook for throttled operations
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = React.useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
}

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [ref, options]);
  
  return isIntersecting;
}

/**
 * Hook for lazy image loading
 */
export function useLazyImage(src: string) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return {
    imgRef,
    src: isLoaded ? src : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=',
    isLoaded
  };
}

/**
 * Hook for efficient list rendering
 */
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    };
  }, [items, itemHeight, containerHeight, scrollTop]);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    handleScroll
  };
}

/**
 * Hook for resource preloading
 */
export function usePreloadResources(resources: Array<{ url: string; type: 'image' | 'script' | 'style' }>) {
  useEffect(() => {
    resources.forEach(({ url, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      
      document.head.appendChild(link);
    });
  }, [resources]);
}

// Import React for hooks
import React from 'react';