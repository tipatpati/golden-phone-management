/**
 * Enhanced Service Management System Exports
 * Single source of truth for the new service architecture
 */

// Core service infrastructure
export { ServiceContainer, serviceContainer } from './ServiceContainer';
export { SharedServiceRegistry, sharedServiceRegistry, ServiceUtils } from './SharedServiceRegistry';
export { Services, getServiceHealthDashboard } from './ServiceBootstrap';
export { bootstrapServices } from './ServiceBootstrap';

// Service interfaces
export type { 
  ServiceDefinition, 
  ServiceInstance, 
  ServiceHealth, 
  ServiceScope,
  ServiceInterface 
} from './ServiceContainer';

export type { 
  SharedServiceConfig, 
  ServiceCategory, 
  ServiceProxy 
} from './SharedServiceRegistry';

// Shared service implementations
export { BarcodeService } from '../shared/BarcodeService';
export { PrintService } from '../shared/PrintService';

// Service interfaces
export type { IBarcodeService, IBarcodeGenerator, IBarcodeRegistry } from '../shared/interfaces/IBarcodeService';
export type { IPrintService, IThermalLabelService, IDocumentPrintService } from '../shared/interfaces/IPrintService';

// Legacy compatibility - keep existing ServiceRegistry for backwards compatibility
export { serviceRegistry, serviceLoaders, getService, preloadCriticalServices } from './ServiceRegistry';

// Service migration utilities
export { 
  Code128GeneratorService, 
  BarcodeRegistryService, 
  ThermalLabelService,
  ServiceMigrationTracker 
} from './ServiceMigration';

// Service health management
export { ServiceHealthManager, serviceHealthManager } from './ServiceHealthManager';
export type { ServiceHealthReport, SystemHealthReport } from './ServiceHealthManager';

/**
 * Migration utilities for transitioning from old to new system
 */
export const ServiceMigration = {
  /**
   * Migrate from legacy service registry to enhanced system
   */
  async migrateLegacyServices(): Promise<void> {
    console.log('🔄 Migrating legacy services to enhanced system...');
    
    // Initialize new system
    const { bootstrapServices } = await import('./ServiceBootstrap');
    await bootstrapServices();
    
    console.log('✅ Legacy services migrated successfully');
  },

  /**
   * Check compatibility between old and new systems
   */
  checkCompatibility(): { compatible: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if legacy services are still being used
    if (typeof window !== 'undefined' && (window as any).legacyServices) {
      issues.push('Legacy services still in use');
    }
    
    return {
      compatible: issues.length === 0,
      issues
    };
  }
};
