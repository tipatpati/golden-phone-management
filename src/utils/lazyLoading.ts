/**
 * Enhanced code splitting and lazy loading for production optimization
 */

import { lazy, ComponentType, FC } from 'react';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';

interface LazyLoadConfig {
  fallback?: ComponentType;
  preload?: boolean;
  chunkName?: string;
}

/**
 * Create a lazy-loaded component with enhanced error handling and preloading
 */
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyLoadConfig = {}
): ComponentType<T> {
  const { fallback: Fallback, preload = false, chunkName } = options;

  const LazyComponent = lazy(async () => {
    const startTime = performance.now();
    
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      
      logger.debug('Component lazy loaded', { 
        chunkName, 
        loadTime: `${loadTime.toFixed(2)}ms` 
      }, 'LazyLoader');
      
      return module;
    } catch (error) {
      logger.error('Failed to lazy load component', { 
        chunkName, 
        error 
      }, 'LazyLoader');
      throw error;
    }
  });

  // Preload if requested and in production
  if (preload && config.performance.enablePerformanceLogging) {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      importFn().catch(error => 
        logger.warn('Failed to preload component', { chunkName, error }, 'LazyLoader')
      );
    }, 100);
  }

  // Return the lazy component with proper typing
  return LazyComponent as ComponentType<T>;
}

/**
 * Preload critical components for better performance
 */
export const preloadCriticalComponents = () => {
  const criticalComponents = [
    () => import('@/components/inventory/InventoryContent'),
  ];

  criticalComponents.forEach((importFn, index) => {
    setTimeout(() => {
      importFn().catch(error => 
        logger.warn('Failed to preload critical component', { index, error }, 'LazyLoader')
      );
    }, index * 50); // Stagger preloads
  });
};

/**
 * Lazy-loaded components for main sections
 */
export const LazyInventoryContent = createLazyComponent(
  () => import('@/components/inventory/InventoryContent').then(mod => ({ default: mod.InventoryContent })),
  { chunkName: 'InventoryContent', preload: true }
);

// Additional lazy components can be added here as modules are created

/**
 * Initialize lazy loading optimizations
 */
export const initializeLazyLoading = () => {
  if (config.performance.enablePerformanceLogging) {
    logger.info('Initializing lazy loading optimizations', {}, 'LazyLoader');
    preloadCriticalComponents();
  }
};