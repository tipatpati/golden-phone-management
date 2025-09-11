/**
 * Service Registry and Dependency Injection Container
 * Provides centralized access to all application services
 */

import { BarcodeService } from '@/services/shared/BarcodeService';
import { BarcodeAuthorityService, getBarcodeAuthority } from './BarcodeAuthorityService';

/**
 * Global service registry for dependency injection
 */
export class Services {
  private static barcodeServiceInstance: BarcodeService | null = null;
  private static barcodeAuthorityInstance: BarcodeAuthorityService | null = null;

  /**
   * Get the injectable barcode service (legacy compatibility)
   */
  static async getBarcodeService(): Promise<BarcodeService> {
    if (!this.barcodeServiceInstance) {
      this.barcodeServiceInstance = new BarcodeService();
    }
    return this.barcodeServiceInstance;
  }

  /**
   * Get the barcode authority service (new single source of truth)
   */
  static getBarcodeAuthority(): BarcodeAuthorityService {
    if (!this.barcodeAuthorityInstance) {
      this.barcodeAuthorityInstance = getBarcodeAuthority();
    }
    return this.barcodeAuthorityInstance;
  }

  /**
   * Reset all services (for testing)
   */
  static reset(): void {
    this.barcodeServiceInstance = null;
    this.barcodeAuthorityInstance = null;
  }

  /**
   * Health check for all services
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
  }> {
    const results: Record<string, any> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    try {
      // Check barcode service
      const barcodeService = await this.getBarcodeService();
      results.barcodeService = await barcodeService.healthCheck();
      
      if (results.barcodeService.status !== 'healthy') {
        overallStatus = 'degraded';
      }
    } catch (error) {
      results.barcodeService = { status: 'unhealthy', error: (error as Error).message };
      overallStatus = 'unhealthy';
    }

    try {
      // Check barcode authority
      const barcodeAuthority = this.getBarcodeAuthority();
      results.barcodeAuthority = await barcodeAuthority.healthCheck();
      
      if (results.barcodeAuthority.status !== 'healthy' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    } catch (error) {
      results.barcodeAuthority = { status: 'unhealthy', error: (error as Error).message };
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      services: results
    };
  }
}