/**
 * Enhanced Service Container with Dependency Injection
 * Provides lifecycle management, health checks, and proper service isolation
 */

export type ServiceScope = 'singleton' | 'transient' | 'scoped';

export interface ServiceDefinition<T = any> {
  name: string;
  factory: (...args: any[]) => T | Promise<T>;
  dependencies?: string[];
  scope?: ServiceScope;
  interfaces?: string[];
  config?: Record<string, any>;
}

export interface ServiceInstance<T = any> {
  service: T;
  scope: ServiceScope;
  created: Date;
  dependencies: string[];
  health: ServiceHealth;
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  error?: Error;
  metrics?: Record<string, number>;
}

export interface ServiceInterface<T = any> {
  name: string;
  methods: (keyof T)[];
}

/**
 * Advanced Service Container with DI, lifecycle management, and health monitoring
 */
export class ServiceContainer {
  private services = new Map<string, ServiceInstance>();
  private definitions = new Map<string, ServiceDefinition>();
  private interfaces = new Map<string, ServiceInterface>();
  private scopedServices = new Map<string, Map<string, any>>();
  private healthChecks = new Map<string, () => Promise<ServiceHealth>>();

  /**
   * Register a service definition
   */
  register<T>(definition: ServiceDefinition<T>): void {
    this.definitions.set(definition.name, definition);
    
    // Register interfaces
    if (definition.interfaces) {
      definition.interfaces.forEach(interfaceName => {
        if (!this.interfaces.has(interfaceName)) {
          this.interfaces.set(interfaceName, {
            name: interfaceName,
            methods: []
          });
        }
      });
    }
  }

  /**
   * Get service by name with dependency resolution
   */
  async get<T>(name: string, scope?: string): Promise<T> {
    // Check for existing singleton/scoped instance
    const existing = this.getExistingInstance<T>(name, scope);
    if (existing) {
      return existing;
    }

    const definition = this.definitions.get(name);
    if (!definition) {
      throw new Error(`Service '${name}' not registered`);
    }

    // Resolve dependencies
    const resolvedDependencies = await this.resolveDependencies(definition.dependencies || []);

    // Create service instance
    const service = await definition.factory(...resolvedDependencies);

    // Store based on scope
    const instance: ServiceInstance<T> = {
      service,
      scope: definition.scope || 'singleton',
      created: new Date(),
      dependencies: definition.dependencies || [],
      health: {
        status: 'unknown',
        lastCheck: new Date()
      }
    };

    this.storeInstance(name, instance, scope);
    
    // Initialize health check if available
    await this.checkServiceHealth(name);

    return service;
  }

  /**
   * Get service by interface
   */
  async getByInterface<T>(interfaceName: string): Promise<T[]> {
    const services: T[] = [];
    
    for (const [name, definition] of this.definitions) {
      if (definition.interfaces?.includes(interfaceName)) {
        const service = await this.get<T>(name);
        services.push(service);
      }
    }
    
    return services;
  }

  /**
   * Register health check for a service
   */
  registerHealthCheck(serviceName: string, healthCheck: () => Promise<ServiceHealth>): void {
    this.healthChecks.set(serviceName, healthCheck);
  }

  /**
   * Check health of all services
   */
  async checkAllHealth(): Promise<Map<string, ServiceHealth>> {
    const results = new Map<string, ServiceHealth>();
    
    for (const [name] of this.services) {
      const health = await this.checkServiceHealth(name);
      results.set(name, health);
    }
    
    return results;
  }

  /**
   * Get service metrics and status
   */
  getServiceStatus(): {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    services: Map<string, ServiceInstance>;
  } {
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    for (const [, instance] of this.services) {
      switch (instance.health.status) {
        case 'healthy':
          healthy++;
          break;
        case 'degraded':
          degraded++;
          break;
        case 'unhealthy':
          unhealthy++;
          break;
      }
    }

    return {
      total: this.services.size,
      healthy,
      degraded,
      unhealthy,
      services: new Map(this.services)
    };
  }

  /**
   * Clear services by scope or all
   */
  clear(scope?: ServiceScope): void {
    if (scope) {
      for (const [name, instance] of this.services) {
        if (instance.scope === scope) {
          this.services.delete(name);
        }
      }
    } else {
      this.services.clear();
      this.scopedServices.clear();
    }
  }

  /**
   * Create a new scope for scoped services
   */
  createScope(scopeId: string): void {
    if (!this.scopedServices.has(scopeId)) {
      this.scopedServices.set(scopeId, new Map());
    }
  }

  /**
   * Dispose a scope and its services
   */
  disposeScope(scopeId: string): void {
    this.scopedServices.delete(scopeId);
  }

  private getExistingInstance<T>(name: string, scope?: string): T | null {
    const definition = this.definitions.get(name);
    if (!definition) return null;

    switch (definition.scope) {
      case 'singleton':
        const singleton = this.services.get(name);
        return singleton?.service as T || null;
      
      case 'scoped':
        if (scope) {
          const scopedMap = this.scopedServices.get(scope);
          return scopedMap?.get(name) as T || null;
        }
        return null;
      
      case 'transient':
      default:
        return null; // Always create new instance
    }
  }

  private storeInstance<T>(name: string, instance: ServiceInstance<T>, scope?: string): void {
    const definition = this.definitions.get(name);
    if (!definition) return;

    switch (definition.scope) {
      case 'singleton':
        this.services.set(name, instance);
        break;
      
      case 'scoped':
        if (scope) {
          let scopedMap = this.scopedServices.get(scope);
          if (!scopedMap) {
            scopedMap = new Map();
            this.scopedServices.set(scope, scopedMap);
          }
          scopedMap.set(name, instance.service);
        }
        break;
      
      case 'transient':
        // Don't store transient services
        break;
    }
  }

  private async resolveDependencies(dependencies: string[]): Promise<any[]> {
    const resolved: any[] = [];
    
    for (const dep of dependencies) {
      const service = await this.get(dep);
      resolved.push(service);
    }
    
    return resolved;
  }

  private async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const healthCheck = this.healthChecks.get(serviceName);
    const instance = this.services.get(serviceName);
    
    if (!instance) {
      return {
        status: 'unknown',
        lastCheck: new Date(),
        error: new Error('Service not found')
      };
    }

    try {
      if (healthCheck) {
        const health = await healthCheck();
        instance.health = health;
        return health;
      } else {
        // Basic health check - service exists and is accessible
        const health: ServiceHealth = {
          status: instance.service ? 'healthy' : 'unhealthy',
          lastCheck: new Date()
        };
        instance.health = health;
        return health;
      }
    } catch (error) {
      const health: ServiceHealth = {
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error as Error
      };
      instance.health = health;
      return health;
    }
  }
}

// Global service container instance
export const serviceContainer = new ServiceContainer();