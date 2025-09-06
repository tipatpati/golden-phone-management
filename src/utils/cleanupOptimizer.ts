/**
 * Runtime cleanup and optimization utilities
 */

// Clean up console statements in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  // Keep console.error and console.warn for production debugging
}

// Memory cleanup utilities
export const memoryOptimization = {
  // Clean up event listeners on unmount
  cleanupEventListeners: () => {
    if (typeof window !== 'undefined') {
      // Remove any global event listeners that might leak
      window.removeEventListener('resize', () => {});
      window.removeEventListener('beforeunload', () => {});
    }
  },

  // Force garbage collection if available
  forceGC: () => {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
      } catch {
        // Graceful fallback
      }
    }
  },

  // Clear browser caches programmatically
  clearCaches: async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      } catch {
        // Graceful fallback
      }
    }
  }
};

// Bundle size optimization
export const bundleOptimization = {
  // Lazy load heavy dependencies
  loadHeavyDependency: async (name: string) => {
    const dependencies: Record<string, () => Promise<any>> = {
      'chart': () => import('recharts'),
      'qr': () => import('qrcode'),
      'barcode': () => import('jsbarcode'),
      'date': () => import('date-fns')
    };

    if (dependencies[name]) {
      return dependencies[name]();
    }
    throw new Error(`Unknown dependency: ${name}`);
  },

  // Prefetch critical resources
  prefetchCritical: () => {
    if (typeof document !== 'undefined') {
      const criticalResources = [
        '/dashboard',
        '/inventory',
        '/sales'
      ];

      criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        document.head.appendChild(link);
      });
    }
  }
};

// Performance monitoring
export const performanceOptimization = {
  // Monitor bundle loading times
  measureBundleLoad: (bundleName: string) => {
    if (typeof performance !== 'undefined') {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        console.info(`Bundle ${bundleName} loaded in ${endTime - startTime}ms`);
      };
    }
    return () => {};
  },

  // Optimize images
  optimizeImage: (imgElement: HTMLImageElement) => {
    imgElement.loading = 'lazy';
    imgElement.decoding = 'async';
  }
};
