/**
 * Shared Service Registry for Cross-Module Services
 * Manages services that are shared across different application modules
 */

import { serviceContainer, ServiceDefinition } from './ServiceContainer';

export interface SharedServiceConfig {
  preload?: boolean;
  critical?: boolean;
  category: ServiceCategory;
  version?: string;
}

export type ServiceCategory = 
  | 'core'           // Database, auth, logging
  | 'shared'         // Barcode, printing, file handling  
  | 'domain'         // Inventory, sales, clients
  | 'integration'    // External APIs, webhooks
  | 'ui';            // UI components, themes

export interface ServiceProxy<T> {
  service: T;
  isHealthy: () => Promise<boolean>;
  getMetrics: () => Promise<Record<string, number>>;
  reload: () => Promise<void>;
}

/**
 * Registry for managing shared services across modules
 */
export class SharedServiceRegistry {
  private serviceConfigs = new Map<string, SharedServiceConfig>();
  private preloadPromises = new Map<string, Promise<any>>();
  private proxies = new Map<string, ServiceProxy<any>>();

  /**
   * Register a shared service with configuration
   */
  registerShared<T>(
    definition: ServiceDefinition<T> & { config?: SharedServiceConfig }
  ): void {
    serviceContainer.register(definition);
    
    if (definition.config) {
      this.serviceConfigs.set(definition.name, definition.config);
      
      // Auto-preload critical services
      if (definition.config.preload || definition.config.critical) {
        this.preloadService(definition.name);
      }
    }
  }

  /**
   * Get shared service with proxy wrapper
   */
  async getShared<T>(serviceName: string): Promise<ServiceProxy<T>> {
    // Return cached proxy if available
    if (this.proxies.has(serviceName)) {
      return this.proxies.get(serviceName)!;
    }

    const service = await serviceContainer.get<T>(serviceName);
    const proxy = this.createServiceProxy(serviceName, service);
    this.proxies.set(serviceName, proxy);
    
    return proxy;
  }

  /**
   * Get services by category
   */
  async getServicesByCategory<T>(category: ServiceCategory): Promise<ServiceProxy<T>[]> {
    const services: ServiceProxy<T>[] = [];
    
    for (const [serviceName, config] of this.serviceConfigs) {
      if (config.category === category) {
        const proxy = await this.getShared<T>(serviceName);
        services.push(proxy);
      }
    }
    
    return services;
  }

  /**
   * Preload critical services in background
   */
  async preloadCriticalServices(): Promise<void> {
    const criticalServices = Array.from(this.serviceConfigs.entries())
      .filter(([, config]) => config.critical)
      .map(([name]) => name);

    await Promise.allSettled(
      criticalServices.map(name => this.preloadService(name))
    );
  }

  /**
   * Get service health status by category
   */
  async getHealthByCategory(): Promise<Map<ServiceCategory, { healthy: number; total: number }>> {
    const healthByCategory = new Map<ServiceCategory, { healthy: number; total: number }>();
    
    for (const [serviceName, config] of this.serviceConfigs) {
      const current = healthByCategory.get(config.category) || { healthy: 0, total: 0 };
      current.total++;
      
      try {
        const proxy = await this.getShared(serviceName);
        const isHealthy = await proxy.isHealthy();
        if (isHealthy) {
          current.healthy++;
        }
      } catch {
        // Service unhealthy, don't increment healthy count
      }
      
      healthByCategory.set(config.category, current);
    }
    
    return healthByCategory;
  }

  /**
   * Reload all services in a category
   */
  async reloadCategory(category: ServiceCategory): Promise<void> {
    const services = await this.getServicesByCategory(category);
    await Promise.allSettled(
      services.map(proxy => proxy.reload())
    );
  }

  /**
   * Get service dependency graph
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const [name, definition] of serviceContainer['definitions']) {
      graph.set(name, definition.dependencies || []);
    }
    
    return graph;
  }

  private async preloadService(serviceName: string): Promise<any> {
    // Prevent duplicate preloading
    if (this.preloadPromises.has(serviceName)) {
      return this.preloadPromises.get(serviceName);
    }

    const promise = serviceContainer.get(serviceName)
      .catch(error => {
        console.warn(`Failed to preload service '${serviceName}':`, error);
        return null;
      });

    this.preloadPromises.set(serviceName, promise);
    return promise;
  }

  private createServiceProxy<T>(serviceName: string, service: T): ServiceProxy<T> {
    return {
      service,
      
      isHealthy: async (): Promise<boolean> => {
        try {
          const allHealth = await serviceContainer.checkAllHealth();
          const health = allHealth.get(serviceName);
          return health?.status === 'healthy';
        } catch {
          return false;
        }
      },
      
      getMetrics: async (): Promise<Record<string, number>> => {
        try {
          const allHealth = await serviceContainer.checkAllHealth();
          const health = allHealth.get(serviceName);
          return health?.metrics || {};
        } catch {
          return {};
        }
      },
      
      reload: async (): Promise<void> => {
        try {
          // Clear service instance and recreate
          serviceContainer.clear('singleton');
          this.proxies.delete(serviceName);
          await serviceContainer.get(serviceName);
        } catch (error) {
          console.error(`Failed to reload service '${serviceName}':`, error);
          throw error;
        }
      }
    };
  }
}

// Global shared service registry
export const sharedServiceRegistry = new SharedServiceRegistry();

/**
 * Utility functions for common service operations
 */
export const ServiceUtils = {
  /**
   * Auto-discover and register services from modules
   */
  autoRegister: async (modulePattern: string): Promise<void> => {
    // Implementation would use dynamic imports to discover services
    // This is a placeholder for the concept
    console.log(`Auto-registering services matching pattern: ${modulePattern}`);
  },

  /**
   * Create service interface validator
   */
  validateInterface: <T>(service: any, requiredMethods: (keyof T)[]): boolean => {
    return requiredMethods.every(method => 
      typeof service[method] === 'function'
    );
  },

  /**
   * Create service performance monitor
   */
  createPerformanceMonitor: (serviceName: string) => {
    const startTimes = new Map<string, number>();
    
    return {
      start: (operation: string) => {
        startTimes.set(operation, performance.now());
      },
      
      end: (operation: string): number => {
        const start = startTimes.get(operation);
        if (!start) return 0;
        
        const duration = performance.now() - start;
        startTimes.delete(operation);
        
        // Could send to monitoring service
        console.debug(`Service ${serviceName}.${operation} took ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
};