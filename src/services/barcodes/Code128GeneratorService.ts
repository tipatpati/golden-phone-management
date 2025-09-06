import { BarcodeRegistryService } from './BarcodeRegistryService';

export interface Code128Options {
  prefix?: string;
  metadata?: Record<string, any>;
}

export interface BarcodeValidationResult {
  isValid: boolean;
  format: string;
  errors: string[];
}

export class Code128GeneratorService {
  // Validate CODE128 format
  static validateCode128(barcode: string): BarcodeValidationResult {
    const errors: string[] = [];
    
    // Basic format validation
    if (!barcode || typeof barcode !== 'string') {
      errors.push('Barcode must be a non-empty string');
      return { isValid: false, format: 'INVALID', errors };
    }

    // Length validation (CODE128 supports variable length, but we set practical limits)
    if (barcode.length < 4 || barcode.length > 25) {
      errors.push('Barcode length must be between 4 and 25 characters');
    }

    // Character validation (CODE128 supports ASCII 0-127)
    const invalidChars = barcode.split('').filter(char => {
      const code = char.charCodeAt(0);
      return code < 32 || code > 126; // Printable ASCII range
    });

    if (invalidChars.length > 0) {
      errors.push(`Invalid characters found: ${invalidChars.join(', ')}`);
    }

    // Check for GPMS prefix format
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

  // Generate CODE128 barcode for product unit
  static async generateUnitBarcode(
    unitId: string,
    options: Code128Options = {}
  ): Promise<string> {
    try {
      const barcode = await BarcodeRegistryService.generateUniqueBarcode(
        'product_unit',
        unitId,
        'unit'
      );

      // Validate generated barcode
      const validation = this.validateCode128(barcode);
      if (!validation.isValid) {
        throw new Error(`Generated invalid barcode: ${validation.errors.join(', ')}`);
      }

      return barcode;
    } catch (error) {
      console.error('Failed to generate unit barcode:', error);
      throw error;
    }
  }

  // Generate CODE128 barcode for product (optional)
  static async generateProductBarcode(
    productId: string,
    options: Code128Options = {}
  ): Promise<string> {
    try {
      const barcode = await BarcodeRegistryService.generateUniqueBarcode(
        'product',
        productId,
        'product'
      );

      // Validate generated barcode
      const validation = this.validateCode128(barcode);
      if (!validation.isValid) {
        throw new Error(`Generated invalid barcode: ${validation.errors.join(', ')}`);
      }

      return barcode;
    } catch (error) {
      console.error('Failed to generate product barcode:', error);
      throw error;
    }
  }

  // Get existing barcode or generate new one
  static async getOrGenerateUnitBarcode(unitId: string): Promise<string> {
    try {
      // Try to get existing barcode
      const existing = await BarcodeRegistryService.getBarcodeByEntity('product_unit', unitId);
      if (existing) {
        return existing.barcode;
      }

      // Generate new barcode
      return await this.generateUnitBarcode(unitId);
    } catch (error) {
      console.error('Failed to get or generate unit barcode:', error);
      throw error;
    }
  }

  // Batch generate barcodes for multiple units
  static async generateBulkUnitBarcodes(unitIds: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const errors: string[] = [];

    for (const unitId of unitIds) {
      try {
        results[unitId] = await this.generateUnitBarcode(unitId);
      } catch (error) {
        errors.push(`Failed to generate barcode for unit ${unitId}: ${error}`);
        console.error(`Failed to generate barcode for unit ${unitId}:`, error);
      }
    }

    if (errors.length > 0) {
      console.warn('Some barcodes failed to generate:', errors);
    }

    return results;
  }

  // Parse barcode information
  static parseBarcodeInfo(barcode: string): {
    prefix: string;
    type: 'unit' | 'product' | 'unknown';
    counter: number;
    isValid: boolean;
  } {
    const validation = this.validateCode128(barcode);
    
    if (!validation.isValid) {
      return {
        prefix: '',
        type: 'unknown',
        counter: 0,
        isValid: false
      };
    }

    // Parse GPMS format: GPMS[U|P]NNNNNN
    const match = barcode.match(/^(GPMS)([UP])(\d{6})$/);
    if (!match) {
      return {
        prefix: '',
        type: 'unknown',
        counter: 0,
        isValid: false
      };
    }

    const [, prefix, typeChar, counterStr] = match;
    const type = typeChar === 'U' ? 'unit' : typeChar === 'P' ? 'product' : 'unknown';
    const counter = parseInt(counterStr, 10);

    return {
      prefix,
      type: type as 'unit' | 'product',
      counter,
      isValid: true
    };
  }
}