/**
 * Service Migration Utilities
 * Helps transition from static services to injectable services
 */

import { Services } from './ServiceBootstrap';
import { BarcodeService } from '../shared/BarcodeService';
import { UnifiedPrintService } from './UnifiedPrintService';

/**
 * Legacy service compatibility layer
 * Provides static access to new injectable services
 */
export class Code128GeneratorService {
  static validateCode128(barcode: string) {
    if (process.env.NODE_ENV === 'development') {
      // Legacy usage tracking removed for production
    }
    
    // Synchronous validation to match legacy interface
    const errors: string[] = [];
    
    if (!barcode || typeof barcode !== 'string') {
      errors.push('Barcode must be a non-empty string');
      return { isValid: false, format: 'INVALID', errors };
    }

    if (barcode.length < 4 || barcode.length > 25) {
      errors.push('Barcode length must be between 4 and 25 characters');
    }

    const invalidChars = barcode.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code < 32 || code > 126;
    });

    if (invalidChars.length > 0) {
      errors.push(`Invalid characters found: ${invalidChars.join(', ')}`);
    }

    const hasGPMSFormat = /^GPMS[UP]\d{6}$/.test(barcode);
    if (!hasGPMSFormat && !errors.length) {
      errors.push('Barcode does not follow GPMS format (GPMS[U|P]NNNNNN)');
    }

    return {
      isValid: errors.length === 0,
      format: 'CODE128',
      errors
    };
  }

  static async generateUnitBarcode(unitId: string, options?: any) {
    const service = await Services.getBarcodeService();
    return service.generateUnitBarcode(unitId, options);
  }

  static async generateProductBarcode(productId: string, options?: any) {
    const service = await Services.getBarcodeService();
    return service.generateProductBarcode(productId, options);
  }

  static async getOrGenerateUnitBarcode(unitId: string) {
    const service = await Services.getBarcodeService();
    return service.getOrGenerateBarcode('product_unit', unitId, 'unit');
  }

  static async generateBulkUnitBarcodes(unitIds: string[]) {
    const service = await Services.getBarcodeService();
    return service.generateBulkBarcodes(
      unitIds.map(entityId => ({ entityId, type: 'unit' as const }))
    );
  }

  static parseBarcodeInfo(barcode: string) {
    if (process.env.NODE_ENV === 'development') {
      ServiceMigrationTracker.logUsage('Code128GeneratorService', 'parseBarcodeInfo');
    }
    
    // Synchronous parsing to match legacy interface
    const match = barcode.match(/^(GPMS)([UP])(\d{6})$/);
    if (!match) {
      return {
        prefix: '',
        type: 'unknown' as const,
        counter: 0,
        isValid: false
      };
    }

    const [, prefix, typeChar, counterStr] = match;
    const type = typeChar === 'U' ? 'unit' : typeChar === 'P' ? 'product' : 'unknown';
    const counter = parseInt(counterStr, 10);

    return {
      prefix,
      type: type as 'unit' | 'product' | 'unknown',
      counter,
      isValid: true
    };
  }
}

export class BarcodeRegistryService {
  static async generateUniqueBarcode(
    entityType: 'product' | 'product_unit',
    entityId: string,
    barcodeType: 'unit' | 'product'
  ) {
    const service = await Services.getBarcodeService();
    if (barcodeType === 'unit') {
      return service.generateUnitBarcode(entityId);
    } else {
      return service.generateProductBarcode(entityId);
    }
  }

  static async registerBarcode(
    barcode: string,
    barcodeType: 'unit' | 'product',
    entityType: 'product' | 'product_unit',
    entityId: string,
    metadata?: Record<string, any>
  ) {
    const service = await Services.getBarcodeService();
    return service.registerBarcode(barcode, barcodeType, entityType, entityId, metadata);
  }

  static async getBarcodeByEntity(
    entityType: 'product' | 'product_unit',
    entityId: string
  ) {
    const service = await Services.getBarcodeService();
    return service.getBarcodeByEntity(entityType, entityId);
  }

  static async validateBarcodeUniqueness(barcode: string) {
    const service = await Services.getBarcodeService();
    return service.validateUniqueness(barcode);
  }

  static async getBarcodeHistory(entityId: string) {
    const service = await Services.getBarcodeService();
    return service.getBarcodeHistory(entityId);
  }
}

export class ThermalLabelService {
  static async generateThermalLabels(labels: any[], options: any) {
    if (process.env.NODE_ENV === 'development') {
      ServiceMigrationTracker.logUsage('ThermalLabelService', 'generateThermalLabels');
    }
    
    // Import adapter dynamically to avoid circular dependencies
    const { Services } = await import('./ServiceBootstrap');
    const printService = await Services.getPrintService();
    return printService.generateLabelHTML(labels, options);
  }

  static async printLabels(labels: any[], options: any) {
    if (process.env.NODE_ENV === 'development') {
      ServiceMigrationTracker.logUsage('ThermalLabelService', 'printLabels');
    }
    
    // Import adapter dynamically to avoid circular dependencies
    const { Services } = await import('./ServiceBootstrap');
    const printService = await Services.getPrintService();
    return printService.printLabels(labels, options);
  }
}

/**
 * Migration tracker to help identify usage
 */
export const ServiceMigrationTracker = {
  logUsage(serviceName: string, method: string) {
    // Production-ready: removed console logging
  }
};