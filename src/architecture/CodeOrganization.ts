/**
 * Code Organization Service
 * Provides utilities for consolidating and organizing code architecture
 */

import { logger } from '@/utils/secureLogger';

/**
 * Abstract base class for business logic services
 */
export abstract class BaseService {
  protected context: string;
  protected initialized: boolean = false;

  constructor(context: string) {
    this.context = context;
  }

  abstract initialize(): Promise<void> | void;
  abstract destroy(): void;

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    logger[level](message, data, this.context);
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Abstract base class for data repositories
 */
export abstract class BaseRepository<T> {
  protected context: string;
  protected cache = new Map<string, T>();

  constructor(context: string) {
    this.context = context;
  }

  abstract findById(id: string): Promise<T | null>;
  abstract findAll(filters?: any): Promise<T[]>;
  abstract create(data: Partial<T>): Promise<T>;
  abstract update(id: string, data: Partial<T>): Promise<T>;
  abstract delete(id: string): Promise<boolean>;

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    logger[level](message, data, this.context);
  }

  protected cacheGet(key: string): T | undefined {
    return this.cache.get(key);
  }

  protected cacheSet(key: string, value: T): void {
    this.cache.set(key, value);
  }

  protected cacheDelete(key: string): boolean {
    return this.cache.delete(key);
  }

  protected cacheClear(): void {
    this.cache.clear();
  }
}

/**
 * Abstract base class for UI controllers
 */
export abstract class BaseController {
  protected context: string;
  protected isLoading: boolean = false;
  protected error: string | null = null;

  constructor(context: string) {
    this.context = context;
  }

  protected setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.log('debug', `Loading state changed: ${loading}`);
  }

  protected setError(error: string | null): void {
    this.error = error;
    if (error) {
      this.log('error', `Error set: ${error}`);
    }
  }

  protected clearError(): void {
    this.error = null;
  }

  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    logger[level](message, data, this.context);
  }

  getState() {
    return {
      isLoading: this.isLoading,
      error: this.error
    };
  }
}

/**
 * Service locator for dependency injection
 */
export class ServiceLocator {
  private static instance: ServiceLocator;
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();

  private constructor() {}

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  /**
   * Register a service instance
   */
  register<T>(name: string, service: T): void {
    this.services.set(name, service);
    logger.debug(`Service registered: ${name}`, {}, 'ServiceLocator');
  }

  /**
   * Register a service factory
   */
  registerFactory<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
    logger.debug(`Service factory registered: ${name}`, {}, 'ServiceLocator');
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    // Check if instance exists
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Check if factory exists
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const instance = factory();
      this.services.set(name, instance);
      return instance;
    }

    throw new Error(`Service not found: ${name}`);
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    logger.debug('All services cleared', {}, 'ServiceLocator');
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return [
      ...this.services.keys(),
      ...this.factories.keys()
    ];
  }
}

/**
 * Module registry for organizing features
 */
export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules = new Map<string, ModuleDefinition>();

  private constructor() {}

  static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  /**
   * Register a module
   */
  register(module: ModuleDefinition): void {
    this.modules.set(module.name, module);
    logger.info(`Module registered: ${module.name}`, { 
      version: module.version,
      dependencies: module.dependencies
    }, 'ModuleRegistry');
  }

  /**
   * Get module by name
   */
  get(name: string): ModuleDefinition | undefined {
    return this.modules.get(name);
  }

  /**
   * Initialize all modules
   */
  async initializeAll(): Promise<void> {
    const sortedModules = this.topologicalSort();
    
    for (const module of sortedModules) {
      try {
        if (module.initialize) {
          await module.initialize();
        }
        logger.info(`Module initialized: ${module.name}`, {}, 'ModuleRegistry');
      } catch (error) {
        logger.error(`Failed to initialize module: ${module.name}`, { error }, 'ModuleRegistry');
        throw error;
      }
    }
  }

  /**
   * Destroy all modules
   */
  async destroyAll(): Promise<void> {
    const modules = Array.from(this.modules.values()).reverse();
    
    for (const module of modules) {
      try {
        if (module.destroy) {
          await module.destroy();
        }
        logger.info(`Module destroyed: ${module.name}`, {}, 'ModuleRegistry');
      } catch (error) {
        logger.error(`Failed to destroy module: ${module.name}`, { error }, 'ModuleRegistry');
      }
    }
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(): ModuleDefinition[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: ModuleDefinition[] = [];

    const visit = (moduleName: string) => {
      if (temp.has(moduleName)) {
        throw new Error(`Circular dependency detected: ${moduleName}`);
      }
      if (visited.has(moduleName)) {
        return;
      }

      temp.add(moduleName);
      const module = this.modules.get(moduleName);
      
      if (module) {
        for (const dep of module.dependencies || []) {
          visit(dep);
        }
        temp.delete(moduleName);
        visited.add(moduleName);
        result.push(module);
      }
    };

    for (const moduleName of this.modules.keys()) {
      if (!visited.has(moduleName)) {
        visit(moduleName);
      }
    }

    return result;
  }
}

/**
 * Module definition interface
 */
export interface ModuleDefinition {
  name: string;
  version: string;
  dependencies?: string[];
  initialize?: () => Promise<void> | void;
  destroy?: () => Promise<void> | void;
  exports?: Record<string, any>;
}

/**
 * Factory for creating standardized modules
 */
export class ModuleFactory {
  /**
   * Create a feature module
   */
  static createFeatureModule(
    name: string,
    version: string,
    config: {
      services?: Record<string, any>;
      repositories?: Record<string, any>;
      controllers?: Record<string, any>;
      dependencies?: string[];
      initialize?: () => Promise<void> | void;
      destroy?: () => Promise<void> | void;
    }
  ): ModuleDefinition {
    const serviceLocator = ServiceLocator.getInstance();

    return {
      name,
      version,
      dependencies: config.dependencies,
      
      async initialize() {
        // Register services
        if (config.services) {
          Object.entries(config.services).forEach(([key, service]) => {
            serviceLocator.register(`${name}.${key}`, service);
          });
        }

        // Register repositories
        if (config.repositories) {
          Object.entries(config.repositories).forEach(([key, repo]) => {
            serviceLocator.register(`${name}.${key}`, repo);
          });
        }

        // Register controllers
        if (config.controllers) {
          Object.entries(config.controllers).forEach(([key, controller]) => {
            serviceLocator.register(`${name}.${key}`, controller);
          });
        }

        // Custom initialization
        if (config.initialize) {
          await config.initialize();
        }

        logger.info(`Feature module initialized: ${name}`, {}, 'ModuleFactory');
      },

      async destroy() {
        if (config.destroy) {
          await config.destroy();
        }
        logger.info(`Feature module destroyed: ${name}`, {}, 'ModuleFactory');
      },

      exports: {
        services: config.services,
        repositories: config.repositories,
        controllers: config.controllers
      }
    };
  }
}

// Export singleton instances
export const serviceLocator = ServiceLocator.getInstance();
export const moduleRegistry = ModuleRegistry.getInstance();