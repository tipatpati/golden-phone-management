import React from 'react';

/**
 * Production build optimizations
 */

// Remove console.log statements in production
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args);
    }
  }
};

// Remove development-only features in production
export const isDevelopment = process.env.NODE_ENV === 'development';

// Optimized component loader
export function createOptimizedComponent<T = any>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>
) {
  const Component = React.lazy(importFn);
  
  return React.forwardRef<any, T>((props, ref) => 
    React.createElement(React.Suspense, 
      { fallback: React.createElement('div', { className: 'animate-pulse' }, 'Loading...') },
      React.createElement(Component, { ...props, ref })
    )
  );
}

// Simple error boundary wrapper for production
export function withErrorBoundary<P extends {}>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    if (isDevelopment) {
      return React.createElement(Component, props);
    }
    
    try {
      return React.createElement(Component, props);
    } catch {
      return React.createElement('div', null, 'Something went wrong');
    }
  };
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}