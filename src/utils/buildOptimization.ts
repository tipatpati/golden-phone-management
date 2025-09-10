/**
 * Build optimization utilities for production
 */

import { logger } from '@/utils/logger';
import { env } from '@/config/environment';

/**
 * Tree shaking optimization for production builds
 */
export const treeShakingConfig = {
  // Remove development-only code in production
  stripDevCode: env.IS_PRODUCTION,
  
  // Dead code elimination patterns
  deadCodePatterns: [
    'console.log',
    'console.debug',
    'console.info',
    'debugger',
    '__DEV__',
    'process.env.NODE_ENV === "development"'
  ],
  
  // Bundle splitting configuration
  chunkSplitting: {
    vendor: {
      test: /[\\/]node_modules[\\/]/,
      name: 'vendors',
      chunks: 'all',
    },
    common: {
      minChunks: 2,
      priority: -10,
      reuseExistingChunk: true,
    }
  }
};

/**
 * Code splitting helpers
 */
export const codeSplitting = {
  /**
   * Lazy load components with error boundaries
   */
  lazyComponent: (
    importFn: () => Promise<{ default: React.ComponentType<any> }>,
    fallback?: React.ComponentType
  ) => {
    const LazyComponent = React.lazy(importFn);
    
    return (props: any) => 
      React.createElement(React.Suspense, {
        fallback: fallback ? React.createElement(fallback) : React.createElement('div', {}, 'Loading...')
      }, React.createElement(LazyComponent, props));
  },
  
  /**
   * Route-based code splitting
   */
  lazyRoute: (importFn: () => Promise<{ default: React.ComponentType }>) => {
    return React.lazy(importFn);
  }
};

/**
 * Asset optimization
 */
export const assetOptimization = {
  /**
   * Image lazy loading with intersection observer
   */
  lazyImage: (src: string, alt: string, className?: string) => {
    // Implementation would use React hooks, moved to hooks file
    return React.createElement('img', {
      src,
      alt,
      className,
      loading: 'lazy'
    });
  },
  
  /**
   * Preload critical resources
   */
  preloadResource: (href: string, type: 'script' | 'style' | 'font' | 'image') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = type;
    
    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  }
};

/**
 * Performance monitoring
 */
export const performanceMonitoring = {
  /**
   * Measure component render time
   */
  measureRender: (componentName: string) => {
    if (!env.IS_PRODUCTION) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        if (renderTime > 16) { // More than one frame
          logger.warn('Slow component render', { 
            component: componentName, 
            renderTime: `${renderTime.toFixed(2)}ms` 
          }, 'Performance');
        }
      };
    }
    
    return () => {}; // No-op in production
  },
  
  /**
   * Monitor memory usage
   */
  monitorMemory: () => {
    if (!env.IS_PRODUCTION && 'memory' in performance) {
      const memory = (performance as any).memory;
      
      logger.debug('Memory usage', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      }, 'Performance');
    }
  }
};

// Import React for lazy loading utilities
import React from 'react';