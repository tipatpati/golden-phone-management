/**
 * Mobile responsiveness utilities and breakpoint management
 */

import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

/**
 * Tailwind CSS breakpoints
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to track current screen size and breakpoint
 */
export function useResponsive() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('lg');

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      // Determine current breakpoint
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else {
        setCurrentBreakpoint('sm');
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return {
    screenSize,
    currentBreakpoint,
    isMobile: currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(currentBreakpoint),
    isXLarge: ['xl', '2xl'].includes(currentBreakpoint)
  };
}

/**
 * Responsive utilities for component styling
 */
export const responsiveUtils = {
  /**
   * Get responsive grid columns based on breakpoint
   */
  getGridColumns: (breakpoint: Breakpoint): string => {
    const columnMap = {
      sm: 'grid-cols-1',
      md: 'grid-cols-2',
      lg: 'grid-cols-3',
      xl: 'grid-cols-4',
      '2xl': 'grid-cols-5'
    };
    return columnMap[breakpoint];
  },

  /**
   * Get responsive padding based on breakpoint
   */
  getResponsivePadding: (breakpoint: Breakpoint): string => {
    const paddingMap = {
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
      '2xl': 'p-10'
    };
    return paddingMap[breakpoint];
  },

  /**
   * Get responsive text size based on breakpoint
   */
  getResponsiveTextSize: (breakpoint: Breakpoint, variant: 'small' | 'medium' | 'large' = 'medium'): string => {
    const sizeMap = {
      small: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-sm',
        xl: 'text-base',
        '2xl': 'text-base'
      },
      medium: {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-base',
        xl: 'text-lg',
        '2xl': 'text-lg'
      },
      large: {
        sm: 'text-base',
        md: 'text-lg',
        lg: 'text-xl',
        xl: 'text-2xl',
        '2xl': 'text-3xl'
      }
    };
    return sizeMap[variant][breakpoint];
  }
};

/**
 * Touch and gesture utilities for mobile
 */
export const touchUtils = {
  /**
   * Detect if device supports touch
   */
  isTouchDevice: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  /**
   * Add touch feedback classes
   */
  getTouchClasses: (): string => {
    return touchUtils.isTouchDevice() 
      ? 'active:scale-95 transition-transform duration-150' 
      : 'hover:scale-105 transition-transform duration-200';
  },

  /**
   * Get appropriate button size for touch devices
   */
  getTouchButtonSize: (): string => {
    return touchUtils.isTouchDevice() ? 'min-h-[44px] min-w-[44px]' : 'min-h-[32px] min-w-[32px]';
  }
};

/**
 * Performance optimizations for mobile
 */
export const mobileOptimizations = {
  /**
   * Detect if on mobile network
   */
  isSlowConnection: (): boolean => {
    const connection = (navigator as any).connection;
    if (!connection) return false;
    
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' ||
           connection.saveData;
  },

  /**
   * Get optimized image loading strategy
   */
  getImageLoadingStrategy: () => {
    if (mobileOptimizations.isSlowConnection()) {
      return { loading: 'lazy' as const, quality: 'low' };
    }
    return { loading: 'eager' as const, quality: 'high' };
  },

  /**
   * Log mobile performance metrics
   */
  logMobileMetrics: () => {
    if (typeof window === 'undefined') return;
    
    const connection = (navigator as any).connection;
    logger.info('Mobile performance metrics', {
      connectionType: connection?.effectiveType || 'unknown',
      saveData: connection?.saveData || false,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: touchUtils.isTouchDevice()
    }, 'MobileOptimization');
  }
};