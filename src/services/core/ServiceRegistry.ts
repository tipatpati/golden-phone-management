// Service registry for centralized service management and lazy loading
class ServiceRegistry {
  private services = new Map<string, any>();
  private loadPromises = new Map<string, Promise<any>>();

  // Register a service
  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  // Get a service synchronously (must be pre-registered)
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found. Make sure it's registered.`);
    }
    return service;
  }

  // Load a service asynchronously
  async load<T>(name: string, loader: () => Promise<T>): Promise<T> {
    // Return cached service if available
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Return existing load promise if in progress
    if (this.loadPromises.has(name)) {
      return this.loadPromises.get(name);
    }

    // Start loading
    const loadPromise = loader().then(service => {
      this.services.set(name, service);
      this.loadPromises.delete(name);
      return service;
    });

    this.loadPromises.set(name, loadPromise);
    return loadPromise;
  }

  // Check if service is available
  has(name: string): boolean {
    return this.services.has(name);
  }

  // Clear all services (useful for testing)
  clear(): void {
    this.services.clear();
    this.loadPromises.clear();
  }

  // Get all registered service names
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// Global service registry instance
export const serviceRegistry = new ServiceRegistry();

// Service loaders for lazy loading
export const serviceLoaders = {
  clients: () => import('../clients/ClientReactQueryService').then(m => m.clientService),
  products: () => import('../products/ProductReactQueryService').then(m => m.productService),
  sales: () => import('../useSales').then(m => m),
  repairs: () => import('../useRepairs').then(m => m),
  employees: () => import('../useEmployees').then(m => m),
  suppliers: () => import('../useSuppliers').then(m => m),
};

// Helper to get a service with lazy loading
export async function getService(name: keyof typeof serviceLoaders): Promise<any> {
  const loader = serviceLoaders[name] as () => Promise<any>;
  return serviceRegistry.load(name, loader);
}

// Preload critical services
export function preloadCriticalServices() {
  // Preload most commonly used services in the background
  getService('clients');
  getService('products');
}