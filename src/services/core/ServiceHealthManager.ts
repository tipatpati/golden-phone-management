/**
 * Service Health Manager
 * Centralized health monitoring and management for all services
 */

import { Services } from './ServiceBootstrap';
import { ServiceContainer } from './ServiceContainer';

export interface ServiceHealthReport {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
  lastCheck: Date;
  responseTime: number;
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealthReport[];
  timestamp: Date;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

export class ServiceHealthManager {
  private static instance: ServiceHealthManager;
  private healthChecks: Map<string, () => Promise<any>> = new Map();
  private lastReports: Map<string, ServiceHealthReport> = new Map();

  private constructor() {
    this.registerDefaultHealthChecks();
  }

  static getInstance(): ServiceHealthManager {
    if (!ServiceHealthManager.instance) {
      ServiceHealthManager.instance = new ServiceHealthManager();
    }
    return ServiceHealthManager.instance;
  }

  /**
   * Register health check for a service
   */
  registerHealthCheck(serviceName: string, healthCheck: () => Promise<any>): void {
    this.healthChecks.set(serviceName, healthCheck);
  }

  /**
   * Perform health check for a specific service
   */
  async checkServiceHealth(serviceName: string): Promise<ServiceHealthReport> {
    const startTime = Date.now();
    
    try {
      const healthCheck = this.healthChecks.get(serviceName);
      if (!healthCheck) {
        return {
          serviceName,
          status: 'unhealthy',
          details: { error: 'No health check registered' },
          lastCheck: new Date(),
          responseTime: Date.now() - startTime
        };
      }

      const result = await healthCheck();
      const report: ServiceHealthReport = {
        serviceName,
        status: result.status || 'healthy',
        details: result.details || result,
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };

      this.lastReports.set(serviceName, report);
      return report;

    } catch (error) {
      const report: ServiceHealthReport = {
        serviceName,
        status: 'unhealthy',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        },
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };

      this.lastReports.set(serviceName, report);
      return report;
    }
  }

  /**
   * Perform health check for all registered services
   */
  async checkAllServicesHealth(): Promise<SystemHealthReport> {
    const serviceNames = Array.from(this.healthChecks.keys());
    const healthPromises = serviceNames.map(name => this.checkServiceHealth(name));
    
    const services = await Promise.all(healthPromises);
    
    const summary = {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      unhealthy: services.filter(s => s.status === 'unhealthy').length
    };

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overall = 'unhealthy';
    } else if (summary.degraded > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      services,
      timestamp: new Date(),
      summary
    };
  }

  /**
   * Get cached health reports (doesn't trigger new checks)
   */
  getCachedHealthReports(): ServiceHealthReport[] {
    return Array.from(this.lastReports.values());
  }

  /**
   * Get health report for specific service from cache
   */
  getCachedServiceHealth(serviceName: string): ServiceHealthReport | undefined {
    return this.lastReports.get(serviceName);
  }

  /**
   * Clear all cached health reports
   */
  clearCache(): void {
    this.lastReports.clear();
  }

  /**
   * Start periodic health monitoring
   */
  startPeriodicHealthChecks(intervalMs: number = 60000): () => void {
    const interval = setInterval(async () => {
      try {
        await this.checkAllServicesHealth();
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }

  /**
   * Register default health checks for core services
   */
  private registerDefaultHealthChecks(): void {
    // Register barcode service health check
    this.registerHealthCheck('BarcodeService', async () => {
      const service = await Services.getBarcodeService();
      return service.healthCheck();
    });

    // Register print service health check  
    this.registerHealthCheck('PrintService', async () => {
      const service = await Services.getPrintService();
      return service.healthCheck();
    });

    // Register service container health check
    this.registerHealthCheck('ServiceContainer', async () => {
      const { serviceContainer } = await import('./ServiceContainer');
      const healthResults = await serviceContainer.checkAllHealth();
      
      const healthyCount = Array.from(healthResults.values()).filter(h => h.status === 'healthy').length;
      const degradedCount = Array.from(healthResults.values()).filter(h => h.status === 'degraded').length;
      const unhealthyCount = Array.from(healthResults.values()).filter(h => h.status === 'unhealthy').length;
      
      return {
        status: unhealthyCount > 0 ? 'unhealthy' : 
                degradedCount > 0 ? 'degraded' : 'healthy',
        details: {
          totalServices: healthResults.size,
          healthyServices: healthyCount,
          degradedServices: degradedCount,
          unhealthyServices: unhealthyCount,
          services: Object.fromEntries(healthResults)
        }
      };
    });
  }
}

// Export singleton instance
export const serviceHealthManager = ServiceHealthManager.getInstance();