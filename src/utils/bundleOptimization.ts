// Bundle optimization utilities
import { lazy } from 'react';

// Simple lazy loading helper for pages
export const createLazyPage = (importFunc: () => Promise<{ default: React.ComponentType<any> }>) => {
  return lazy(importFunc);
};

// Dynamic imports for services
export const loadServiceDynamically = async <T>(serviceName: string): Promise<T> => {
  switch (serviceName) {
    case 'clients':
      const { clientService } = await import('@/services/clients/ClientReactQueryService');
      return clientService as T;
    case 'products':
      const { productService } = await import('@/services/products/ProductReactQueryService');
      return productService as T;
    default:
      throw new Error(`Service ${serviceName} not found`);
  }
};

// Preload critical resources
export const preloadCriticalServices = () => {
  // Preload most commonly used services
  import('@/services/clients/ClientReactQueryService');
  import('@/services/products/ProductReactQueryService');
};

// Tree-shaking friendly re-exports
export const createSelectiveExport = <T extends Record<string, any>>(
  module: T,
  allowedKeys: (keyof T)[]
): Partial<T> => {
  const result: Partial<T> = {};
  allowedKeys.forEach(key => {
    if (key in module) {
      result[key] = module[key];
    }
  });
  return result;
};

// Memory optimization for large datasets
export const createVirtualizedLoader = <T>(
  loader: () => Promise<T[]>,
  chunkSize: number = 50
) => {
  let cache: T[] | null = null;
  
  return {
    async getChunk(start: number, end: number): Promise<T[]> {
      if (!cache) {
        cache = await loader();
      }
      return cache.slice(start, end);
    },
    
    async getTotal(): Promise<number> {
      if (!cache) {
        cache = await loader();
      }
      return cache.length;
    },
    
    clearCache() {
      cache = null;
    }
  };
};