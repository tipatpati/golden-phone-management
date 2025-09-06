/**
 * Optimized bundle splitting and performance utilities
 */

// Service loader with optimized error handling
export const loadService = async (serviceName: string) => {
  const serviceMap: Record<string, () => Promise<any>> = {
    inventory: () => import('@/services/products/ProductReactQueryService'),
    sales: () => import('@/services/sales/SalesReactQueryService'),
    clients: () => import('@/services/clients/ClientReactQueryService'),
    repairs: () => import('@/services/repairs/RepairsReactQueryService'),
    suppliers: () => import('@/services/suppliers/SuppliersReactQueryService'),
    employees: () => import('@/services/employees/EmployeesReactQueryService'),
  };

  const importFn = serviceMap[serviceName];
  if (!importFn) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  return importFn();
};

// Optimized resource prefetching
export const prefetchCriticalResources = () => {
  if (typeof document === 'undefined') return;

  const links = [
    { rel: 'prefetch', href: '/dashboard' },
    { rel: 'prefetch', href: '/inventory' },
  ];

  links.forEach(link => {
    const existing = document.querySelector(`link[href="${link.href}"]`);
    if (!existing) {
      const linkElement = document.createElement('link');
      Object.assign(linkElement, link);
      document.head.appendChild(linkElement);
    }
  });
};

// Memory cleanup for production
export const optimizeMemoryUsage = () => {
  if (process.env.NODE_ENV === 'production' && 'gc' in window) {
    try {
      (window as any).gc();
    } catch {
      // Graceful fallback
    }
  }
};