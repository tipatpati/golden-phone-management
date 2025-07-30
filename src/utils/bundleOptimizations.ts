import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Bundle splitting and code optimization utilities
 */

// Lazy load pages
export const DashboardPage = React.lazy(() => import('@/pages/Dashboard'));
export const InventoryPage = React.lazy(() => import('@/pages/Inventory'));
export const SalesPage = React.lazy(() => import('@/pages/Sales'));
export const ClientsPage = React.lazy(() => import('@/pages/Clients'));
export const RepairsPage = React.lazy(() => import('@/pages/Repairs'));
export const SuppliersPage = React.lazy(() => import('@/pages/Suppliers'));
export const EmployeeManagementPage = React.lazy(() => import('@/pages/EmployeeManagement'));

// Remove problematic lazy loads for components that don't have default exports

// Component factory for lazy loading with custom loading state
export function createLazyComponent<P = {}>(
  importFunction: () => Promise<{ default: React.ComponentType<P> }>,
  LoadingComponent: React.ComponentType = () => React.createElement('div', { className: 'flex items-center justify-center p-8' }, React.createElement(LoadingSpinner, { size: 'lg' }))
) {
  const LazyComponent = React.lazy(importFunction);

  return React.forwardRef<any, P>((props, ref) => 
    React.createElement(Suspense, 
      { fallback: React.createElement(LoadingComponent) },
      React.createElement(LazyComponent, { ...props, ref })
    )
  );
}

// Preload critical components
export function preloadCriticalComponents() {
  const criticalImports = [
    () => import('@/pages/Dashboard'),
    () => import('@/components/layout/Header'),
    () => import('@/components/layout/SideNavigation'),
  ];

  return Promise.allSettled(criticalImports.map(importFn => importFn()));
}

// Dynamic imports for feature modules
export const dynamicImports = {
  inventory: () => import('@/services/products/ProductReactQueryService'),
  sales: () => import('@/services/sales/SalesReactQueryService'),
  clients: () => import('@/services/clients/ClientReactQueryService'),
  repairs: () => import('@/services/repairs/RepairsReactQueryService'),
  suppliers: () => import('@/services/suppliers/SuppliersReactQueryService'),
  employees: () => import('@/services/employees/EmployeesReactQueryService'),
} as const;

// Service loader for dynamic imports
export async function loadService(serviceName: keyof typeof dynamicImports) {
  try {
    const module = await dynamicImports[serviceName]();
    return module;
  } catch (error) {
    console.error(`Failed to load service: ${serviceName}`, error);
    throw error;
  }
}

// Resource prefetching
export function prefetchResources() {
  const prefetchLinks = [
    { rel: 'prefetch', href: '/dashboard' },
    { rel: 'prefetch', href: '/inventory' },
    { rel: 'preload', href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
  ];

  prefetchLinks.forEach(link => {
    const linkElement = document.createElement('link');
    Object.assign(linkElement, link);
    document.head.appendChild(linkElement);
  });
}

// Code splitting by route
export const routeBasedSplitting = {
  '/dashboard': () => import('@/pages/Dashboard'),
  '/inventory': () => import('@/pages/Inventory'),
  '/sales': () => import('@/pages/Sales'),
  '/clients': () => import('@/pages/Clients'),
  '/repairs': () => import('@/pages/Repairs'),
  '/suppliers': () => import('@/pages/Suppliers'),
  '/employees': () => import('@/pages/EmployeeManagement'),
} as const;

// Bundle analysis helper
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.group('Bundle Analysis');
    console.log('Dynamic imports available:', Object.keys(dynamicImports));
    console.log('Route splitting available:', Object.keys(routeBasedSplitting));
    console.groupEnd();
  }
}

// Memory management
export function cleanupUnusedModules() {
  // This would typically be handled by webpack or Vite
  // but we can provide hints for garbage collection
  if ('webkitClearCache' in window) {
    (window as any).webkitClearCache();
  }
}