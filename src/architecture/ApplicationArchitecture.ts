/**
 * Application Architecture Setup
 * Initializes all Phase 3 improvements and organizes the application architecture
 */

import { logger } from '@/utils/secureLogger';
import { 
  moduleRegistry, 
  serviceLocator, 
  ModuleFactory, 
  BaseService, 
  BaseRepository 
} from '@/architecture/CodeOrganization';
import { TestFramework } from '@/testing/TestingFramework';
import { globalRetryManager, globalSyncManager } from '@/services/core/DataFlowReliability';

/**
 * Application Architecture Manager
 */
export class ApplicationArchitecture {
  private static instance: ApplicationArchitecture;
  private initialized = false;

  private constructor() {}

  static getInstance(): ApplicationArchitecture {
    if (!ApplicationArchitecture.instance) {
      ApplicationArchitecture.instance = new ApplicationArchitecture();
    }
    return ApplicationArchitecture.instance;
  }

  /**
   * Initialize the complete application architecture
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Application architecture already initialized', {}, 'ApplicationArchitecture');
      return;
    }

    try {
      logger.info('Initializing application architecture...', {}, 'ApplicationArchitecture');

      // Phase 1: Initialize core services
      await this.initializeCoreServices();

      // Phase 2: Register application modules
      await this.registerApplicationModules();

      // Phase 3: Setup data flow and reliability
      await this.setupDataFlow();

      // Phase 4: Initialize testing framework
      await this.initializeTestingFramework();

      // Phase 5: Setup monitoring and observability
      await this.setupMonitoring();

      this.initialized = true;
      logger.info('Application architecture initialized successfully', {}, 'ApplicationArchitecture');
    } catch (error) {
      logger.error('Failed to initialize application architecture', { error }, 'ApplicationArchitecture');
      throw error;
    }
  }

  /**
   * Initialize core services
   */
  private async initializeCoreServices(): Promise<void> {
    logger.debug('Initializing core services...', {}, 'ApplicationArchitecture');

    // Register logging service
    serviceLocator.register('logger', logger);

    // Register retry manager
    serviceLocator.register('retryManager', globalRetryManager);

    // Register sync manager
    serviceLocator.register('syncManager', globalSyncManager);

    logger.debug('Core services initialized', {}, 'ApplicationArchitecture');
  }

  /**
   * Register application modules
   */
  private async registerApplicationModules(): Promise<void> {
    logger.debug('Registering application modules...', {}, 'ApplicationArchitecture');

    // Inventory Module
    const inventoryModule = ModuleFactory.createFeatureModule('inventory', '1.0.0', {
      dependencies: ['core'],
      initialize: async () => {
        logger.debug('Inventory module initializing...', {}, 'InventoryModule');
      }
    });
    moduleRegistry.register(inventoryModule);

    // Clients Module
    const clientsModule = ModuleFactory.createFeatureModule('clients', '1.0.0', {
      dependencies: ['core'],
      initialize: async () => {
        logger.debug('Clients module initializing...', {}, 'ClientsModule');
      }
    });
    moduleRegistry.register(clientsModule);

    // Sales Module
    const salesModule = ModuleFactory.createFeatureModule('sales', '1.0.0', {
      dependencies: ['core', 'inventory', 'clients'],
      initialize: async () => {
        logger.debug('Sales module initializing...', {}, 'SalesModule');
      }
    });
    moduleRegistry.register(salesModule);

    // Initialize all modules
    await moduleRegistry.initializeAll();

    logger.debug('Application modules registered and initialized', {}, 'ApplicationArchitecture');
  }

  /**
   * Setup data flow and reliability
   */
  private async setupDataFlow(): Promise<void> {
    logger.debug('Setting up data flow and reliability...', {}, 'ApplicationArchitecture');

    // Configure global error handling
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection', { 
        reason: event.reason 
      }, 'GlobalErrorHandler');
    });

    // Configure global fetch interceptor for retry logic
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as any).url;
      
      return globalRetryManager.executeWithRetry(
        `fetch-${url}`,
        () => originalFetch(input, init),
        {
          maxRetries: 2,
          shouldRetry: (error) => {
            // Only retry on network errors, not on HTTP errors
            return !error.message.includes('HTTP');
          }
        }
      );
    };

    logger.debug('Data flow and reliability configured', {}, 'ApplicationArchitecture');
  }

  /**
   * Initialize testing framework
   */
  private async initializeTestingFramework(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      logger.debug('Initializing testing framework...', {}, 'ApplicationArchitecture');

      // Setup global test utilities
      if (typeof global !== 'undefined') {
        (global as any).TestFramework = TestFramework;
      }

      logger.debug('Testing framework initialized', {}, 'ApplicationArchitecture');
    }
  }

  /**
   * Setup monitoring and observability
   */
  private async setupMonitoring(): Promise<void> {
    logger.debug('Setting up monitoring and observability...', {}, 'ApplicationArchitecture');

    // Performance monitoring
    if ('performance' in window && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            logger.info('Page navigation completed', {
              loadTime: entry.duration,
              type: entry.name
            }, 'PerformanceMonitor');
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource'] });
    }

    // Memory monitoring
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
          logger.warn('High memory usage detected', {
            used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
          }, 'MemoryMonitor');
        }
      }
    }, 30000); // Check every 30 seconds

    logger.debug('Monitoring and observability configured', {}, 'ApplicationArchitecture');
  }

  /**
   * Get application health status
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      modules: Array.from((moduleRegistry as any).modules?.keys() || []),
      services: serviceLocator.getServiceNames(),
      retryOperations: 'available',
      syncOperations: 'available'
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      logger.info('Shutting down application architecture...', {}, 'ApplicationArchitecture');

      // Cleanup data flow managers
      globalRetryManager.cleanup();
      globalSyncManager.clearAll();

      // Destroy modules
      await moduleRegistry.destroyAll();

      // Clear services
      serviceLocator.clear();

      this.initialized = false;
      logger.info('Application architecture shutdown completed', {}, 'ApplicationArchitecture');
    } catch (error) {
      logger.error('Error during application shutdown', { error }, 'ApplicationArchitecture');
    }
  }
}

// Export singleton instance
export const applicationArchitecture = ApplicationArchitecture.getInstance();

/**
 * Initialize application on startup
 */
export async function initializeApplication(): Promise<void> {
  try {
    await applicationArchitecture.initialize();
  } catch (error) {
    logger.error('Failed to initialize application', { error }, 'ApplicationInit');
    throw error;
  }
}

/**
 * Application lifecycle hooks
 */
export const applicationLifecycle = {
  onStartup: async () => {
    await initializeApplication();
  },
  
  onShutdown: async () => {
    await applicationArchitecture.shutdown();
  },
  
  getStatus: () => {
    return applicationArchitecture.getHealthStatus();
  }
};