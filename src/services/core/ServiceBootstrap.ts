/**
 * Service Bootstrap - Register and Initialize All Services
 * Central place to configure the enhanced service management system
 */

import { sharedServiceRegistry } from './SharedServiceRegistry';
import { serviceContainer } from './ServiceContainer';
import { BarcodeService } from '../shared/BarcodeService';
import { PrintService } from '../shared/PrintService';

/**
 * Bootstrap all services in the application
 */
export async function bootstrapServices(): Promise<void> {
  console.log('🚀 Bootstrapping enhanced service management system...');

  // Register core shared services
  registerSharedServices();
  
  // Register domain services
  registerDomainServices();
  
  // Register integration services
  registerIntegrationServices();
  
  // Preload critical services
  await sharedServiceRegistry.preloadCriticalServices();
  
  console.log('✅ Service management system initialized');
}

/**
 * Register shared services that are used across modules
 */
function registerSharedServices(): void {
  // Barcode Service - Critical shared service
  sharedServiceRegistry.registerShared({
    name: 'barcodeService',
    factory: () => new BarcodeService(),
    scope: 'singleton',
    interfaces: ['IBarcodeService'],
    config: {
      category: 'shared',
      critical: true,
      preload: true
    }
  });

  // Print Service - Shared service
  sharedServiceRegistry.registerShared({
    name: 'printService',
    factory: () => new PrintService(),
    scope: 'singleton',
    interfaces: ['IPrintService'],
    config: {
      category: 'shared',
      critical: false,
      preload: false
    }
  });

  // Health check registration
  serviceContainer.registerHealthCheck('barcodeService', async () => {
    const barcodeService = await serviceContainer.get<BarcodeService>('barcodeService');
    const health = await barcodeService.healthCheck();
    return {
      ...health,
      lastCheck: new Date()
    };
  });

  serviceContainer.registerHealthCheck('printService', async () => {
    const printService = await serviceContainer.get<PrintService>('printService');
    const health = await printService.healthCheck();
    return {
      ...health,
      lastCheck: new Date()
    };
  });
}

/**
 * Register domain-specific services
 */
function registerDomainServices(): void {
  // Inventory Services
  sharedServiceRegistry.registerShared({
    name: 'inventoryService',
    factory: async () => {
      const module = await import('../inventory/InventoryReactQueryService');
      return module; // Return the whole module for now
    },
    scope: 'singleton',
    config: {
      category: 'domain',
      critical: false,
      preload: false
    }
  });

  // Sales Services  
  sharedServiceRegistry.registerShared({
    name: 'salesService',
    factory: async () => {
      const { salesService } = await import('../sales/SalesReactQueryService');
      return salesService;
    },
    scope: 'singleton',
    config: {
      category: 'domain',
      critical: false,
      preload: false
    }
  });

  // Client Services
  sharedServiceRegistry.registerShared({
    name: 'clientService',
    factory: async () => {
      const { clientService } = await import('../clients/ClientReactQueryService');
      return clientService;
    },
    scope: 'singleton',
    config: {
      category: 'domain',
      critical: false,
      preload: false
    }
  });

  // Supplier Services
  sharedServiceRegistry.registerShared({
    name: 'supplierService',
    factory: async () => {
      const { suppliersService } = await import('../suppliers/SuppliersReactQueryService');
      return suppliersService;
    },
    scope: 'singleton',
    config: {
      category: 'domain',
      critical: false,
      preload: false
    }
  });

  // Employee Services
  sharedServiceRegistry.registerShared({
    name: 'employeeService',
    factory: async () => {
      const { employeesService } = await import('../employees/EmployeesReactQueryService');
      return employeesService;
    },
    scope: 'singleton',
    config: {
      category: 'domain',
      critical: false,
      preload: false
    }
  });

  // Repair Services
  sharedServiceRegistry.registerShared({
    name: 'repairService',
    factory: async () => {
      const { repairsService } = await import('../repairs/RepairsReactQueryService');
      return repairsService;
    },
    scope: 'singleton',
    config: {
      category: 'domain',
      critical: false,
      preload: false
    }
  });
}

/**
 * Register integration services for external APIs
 */
function registerIntegrationServices(): void {
  // Could add services for:
  // - External barcode APIs
  // - Payment processors  
  // - Shipping APIs
  // - Analytics services
  // - Notification services
}

/**
 * Get service health dashboard data
 */
export async function getServiceHealthDashboard() {
  const healthByCategory = await sharedServiceRegistry.getHealthByCategory();
  const overallStatus = serviceContainer.getServiceStatus();
  
  return {
    overall: overallStatus,
    byCategory: Object.fromEntries(healthByCategory),
    dependencyGraph: sharedServiceRegistry.getDependencyGraph()
  };
}

/**
 * Utility functions for service access
 */
export const Services = {
  /**
   * Get barcode service
   */
  async getBarcodeService(): Promise<BarcodeService> {
    const proxy = await sharedServiceRegistry.getShared<BarcodeService>('barcodeService');
    return proxy.service;
  },

  /**
   * Get print service
   */
  async getPrintService(): Promise<PrintService> {
    const proxy = await sharedServiceRegistry.getShared<PrintService>('printService');
    return proxy.service;
  },

  /**
   * Get any service by name with type safety
   */
  async get<T>(serviceName: string): Promise<T> {
    return serviceContainer.get<T>(serviceName);
  },

  /**
   * Get services by category
   */
  async getByCategory<T>(category: Parameters<typeof sharedServiceRegistry.getServicesByCategory>[0]): Promise<T[]> {
    const proxies = await sharedServiceRegistry.getServicesByCategory<T>(category);
    return proxies.map(proxy => proxy.service);
  },

  /**
   * Check if service is healthy
   */
  async isHealthy(serviceName: string): Promise<boolean> {
    try {
      const proxy = await sharedServiceRegistry.getShared(serviceName);
      return proxy.isHealthy();
    } catch {
      return false;
    }
  }
};