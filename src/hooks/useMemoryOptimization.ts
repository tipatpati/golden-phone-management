import { useCallback, useMemo, useRef, useEffect } from 'react';

// Memory-optimized event handler
export function useMemoryOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);
  
  return useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;
}

// Debounced memory-optimized callback
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, deps);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;
}

// Memory-optimized memoization
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  const prevDepsRef = useRef<React.DependencyList>();
  const valueRef = useRef<T>();
  
  const depsChanged = !prevDepsRef.current || 
    deps.some((dep, index) => dep !== prevDepsRef.current![index]);
  
  if (depsChanged) {
    valueRef.current = factory();
    prevDepsRef.current = deps;
  }
  
  return valueRef.current!;
}

// Cleanup manager for components
export function useCleanup() {
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  
  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
  }, []);
  
  useEffect(() => {
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup function failed:', error);
        }
      });
      cleanupFunctionsRef.current = [];
    };
  }, []);
  
  return addCleanup;
}

// Memory usage monitor (Chrome-specific performance.memory)
export function useMemoryMonitor(componentName: string) {
  const startTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const checkMemory = () => {
      // Type-safe check for Chrome's performance.memory
      const chromePerformance = performance as any;
      if (chromePerformance.memory) {
        const memoryInfo = {
          component: componentName,
          used: Math.round(chromePerformance.memory.usedJSHeapSize / 1048576),
          total: Math.round(chromePerformance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(chromePerformance.memory.jsHeapSizeLimit / 1048576),
          timeActive: Date.now() - startTimeRef.current
        };
        
        // Only log in development or if memory usage is high
        if (process.env.NODE_ENV === 'development' || memoryInfo.used > 50) {
          console.debug(`Memory usage for ${componentName}:`, memoryInfo);
        }
      }
    };
    
    // Check memory on mount and every 30 seconds
    checkMemory();
    const interval = setInterval(checkMemory, 30000);
    
    return () => clearInterval(interval);
  }, [componentName]);
}