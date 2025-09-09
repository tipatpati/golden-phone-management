/**
 * Service Migration Utilities
 * Helps transition from static services to injectable services
 */

import { Services } from './ServiceBootstrap';
import { BarcodeService } from '../shared/BarcodeService';
import { PrintService } from '../shared/PrintService';

/**
 * Legacy service compatibility layer
 * Provides static access to new injectable services
 */
export class Code128GeneratorService {
  static async validateCode128(barcode: string) {
    const service = await Services.getBarcodeService();
    return service.validateBarcode(barcode);
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

  static async parseBarcodeInfo(barcode: string) {
    const service = await Services.getBarcodeService();
    const validation = service.validateBarcode(barcode);
    
    return {
      ...validation.parsedData,
      isValid: validation.isValid
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
    const service = await Services.getPrintService();
    return service.generateLabelHTML(labels, options);
  }

  static async printLabels(labels: any[], options: any) {
    const service = await Services.getPrintService();
    return service.printLabels(labels, options);
  }
}

/**
 * Migration tracker to help identify usage
 */
export const ServiceMigrationTracker = {
  logUsage(serviceName: string, method: string) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ Legacy service usage: ${serviceName}.${method} - Consider migrating to injectable services`);
    }
  }
};