/**
 * Memory Management Utilities
 * Provides utilities for managing memory usage and preventing leaks
 */

import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/secureLogger';

export class MemoryManager {
  private static cleanupTasks: Set<() => void> = new Set();
  private static memoryWarningThreshold = 50 * 1024 * 1024; // 50MB

  /**
   * Register cleanup task
   */
  static registerCleanup(cleanup: () => void): () => void {
    this.cleanupTasks.add(cleanup);
    return () => this.cleanupTasks.delete(cleanup);
  }

  /**
   * Execute all cleanup tasks
   */
  static cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        logger.error('Cleanup task failed', { error }, 'MemoryManager');
      }
    });
    this.cleanupTasks.clear();
  }

  /**
   * Monitor memory usage
   */
  static monitorMemory(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      
      if (memory.usedJSHeapSize > this.memoryWarningThreshold) {
        logger.warn('High memory usage detected', {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        }, 'MemoryManager');
      }
    }
  }

  /**
   * Create memory-efficient cache
   */
  static createCache<K, V>(maxSize: number = 100): Map<K, V> & { cleanup: () => void } {
    const cache = new Map<K, V>();
    
    const wrappedCache = cache as Map<K, V> & { cleanup: () => void };
    
    wrappedCache.set = function(key: K, value: V) {
      if (this.size >= maxSize) {
        const firstKey = this.keys().next().value;
        this.delete(firstKey);
      }
      return Map.prototype.set.call(this, key, value);
    };
    
    wrappedCache.cleanup = () => {
      cache.clear();
    };
    
    MemoryManager.registerCleanup(wrappedCache.cleanup);
    
    return wrappedCache;
  }

  /**
   * Weak reference utility
   */
  static createWeakRef<T extends object>(target: T): WeakRef<T> | { deref: () => T | undefined } {
    if (typeof WeakRef !== 'undefined') {
      return new WeakRef(target);
    }
    
    // Fallback for environments without WeakRef
    return {
      deref: () => target
    };
  }
}

/**
 * Hook for automatic cleanup on unmount
 */
export function useMemoryCleanup(cleanup: () => void) {
  useEffect(() => {
    const unregister = MemoryManager.registerCleanup(cleanup);
    return unregister;
  }, [cleanup]);
}

/**
 * Hook for managing timeouts and intervals
 */
export function useTimeouts() {
  const timeouts = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const timeoutId = globalThis.setTimeout(() => {
      timeouts.current.delete(timeoutId);
      callback();
    }, delay);
    
    timeouts.current.add(timeoutId);
    return timeoutId;
  }, []);

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const intervalId = globalThis.setInterval(callback, delay);
    intervals.current.add(intervalId);
    return intervalId;
  }, []);

  const clearTimeout = useCallback((timeoutId: NodeJS.Timeout) => {
    globalThis.clearTimeout(timeoutId);
    timeouts.current.delete(timeoutId);
  }, []);

  const clearInterval = useCallback((intervalId: NodeJS.Timeout) => {
    globalThis.clearInterval(intervalId);
    intervals.current.delete(intervalId);
  }, []);

  const clearAll = useCallback(() => {
    timeouts.current.forEach(id => globalThis.clearTimeout(id));
    intervals.current.forEach(id => globalThis.clearInterval(id));
    timeouts.current.clear();
    intervals.current.clear();
  }, []);

  useEffect(() => clearAll, [clearAll]);

  return {
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    clearAll
  };
}

/**
 * Hook for managing event listeners
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | Document | HTMLElement = window
) {
  const savedHandler = useRef<(event: WindowEventMap[K]) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element?.addEventListener) return;

    const eventListener = (event: WindowEventMap[K]) => {
      savedHandler.current?.(event);
    };

    element.addEventListener(eventName, eventListener as any);

    return () => {
      element.removeEventListener(eventName, eventListener as any);
    };
  }, [eventName, element]);
}

/**
 * Hook for managing abort controllers
 */
export function useAbortController() {
  const controllers = useRef<Set<AbortController>>(new Set());

  const createController = useCallback(() => {
    const controller = new AbortController();
    controllers.current.add(controller);
    return controller;
  }, []);

  const abortAll = useCallback(() => {
    controllers.current.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    controllers.current.clear();
  }, []);

  useEffect(() => abortAll, [abortAll]);

  return {
    createController,
    abortAll
  };
}