/**
 * Barcode Authority Service - Single Source of Truth for All Barcode Operations
 * This service is the ONLY authority for barcode generation, validation, and integrity
 */

import type { 
  IBarcodeService, 
  BarcodeGenerationOptions, 
  BarcodeValidationResult, 
  BarcodeRecord 
} from '@/services/shared/interfaces/IBarcodeService';
import { BarcodeService } from '@/services/shared/BarcodeService';

/**
 * Barcode Data Contract - Ensures barcode integrity throughout the system
 */
export interface BarcodeDataContract {
  barcode: string;
  source: 'existing' | 'generated' | 'fallback';
  validation: BarcodeValidationResult;
  traceId: string;
  timestamp: string;
  entityType: 'product' | 'product_unit';
  entityId: string;
}

/**
 * Barcode Authority Configuration
 */
export interface BarcodeAuthorityConfig {
  enableValidation: boolean;
  enableTracing: boolean;
  fallbackEnabled: boolean;
  maxRetries: number;
}

/**
 * Single Source of Truth for All Barcode Operations
 * 
 * This service acts as the authority for barcode operations, ensuring:
 * - Consistent barcode generation across all modules
 * - Validation at every transformation point  
 * - Tracing for debugging barcode flow issues
 * - Integrity checks between preview and print
 */
export class BarcodeAuthorityService implements IBarcodeService {
  private delegateService: BarcodeService;
  private config: BarcodeAuthorityConfig;
  private barcodeTrace: Map<string, BarcodeDataContract> = new Map();

  constructor(config: Partial<BarcodeAuthorityConfig> = {}) {
    this.delegateService = new BarcodeService();
    this.config = {
      enableValidation: true,
      enableTracing: true,
      fallbackEnabled: false,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Generate a unique barcode for a product unit with full traceability
   */
  async generateUnitBarcode(unitId: string, options?: BarcodeGenerationOptions): Promise<string> {
    const traceId = this.generateTraceId('unit', unitId);
    
    try {
      console.log(`🔑 BarcodeAuthority: Generating unit barcode for ${unitId} [${traceId}]`);
      
      // Check for existing barcode first
      const existing = await this.getBarcodeByEntity('product_unit', unitId);
      if (existing) {
        console.log(`✅ BarcodeAuthority: Found existing unit barcode ${existing.barcode} [${traceId}]`);
        return this.createDataContract(existing.barcode, 'existing', 'product_unit', unitId, traceId);
      }

      // Generate new barcode through delegate
      const barcode = await this.delegateService.generateUnitBarcode(unitId, options);
      
      return this.createDataContract(barcode, 'generated', 'product_unit', unitId, traceId);
      
    } catch (error) {
      console.error(`❌ BarcodeAuthority: Failed to generate unit barcode [${traceId}]:`, error);
      throw new Error(`Barcode generation failed for unit ${unitId}: ${error}`);
    }
  }

  /**
   * Generate a unique barcode for a product with full traceability
   */
  async generateProductBarcode(productId: string, options?: BarcodeGenerationOptions): Promise<string> {
    const traceId = this.generateTraceId('product', productId);
    
    try {
      console.log(`🔑 BarcodeAuthority: Generating product barcode for ${productId} [${traceId}]`);
      
      // Check for existing barcode first
      const existing = await this.getBarcodeByEntity('product', productId);
      if (existing) {
        console.log(`✅ BarcodeAuthority: Found existing product barcode ${existing.barcode} [${traceId}]`);
        return this.createDataContract(existing.barcode, 'existing', 'product', productId, traceId);
      }

      // Generate new barcode through delegate
      const barcode = await this.delegateService.generateProductBarcode(productId, options);
      
      return this.createDataContract(barcode, 'generated', 'product', productId, traceId);
      
    } catch (error) {
      console.error(`❌ BarcodeAuthority: Failed to generate product barcode [${traceId}]:`, error);
      throw new Error(`Barcode generation failed for product ${productId}: ${error}`);
    }
  }

  /**
   * Get or generate barcode with comprehensive tracking
   */
  async getOrGenerateBarcode(
    entityType: 'product' | 'product_unit',
    entityId: string,
    barcodeType: 'unit' | 'product',
    options?: BarcodeGenerationOptions
  ): Promise<string> {
    const traceId = this.generateTraceId(barcodeType, entityId);
    
    console.log(`🔍 BarcodeAuthority: Get or generate ${barcodeType} barcode for ${entityType}:${entityId} [${traceId}]`);
    
    if (barcodeType === 'unit') {
      return this.generateUnitBarcode(entityId, options);
    } else {
      return this.generateProductBarcode(entityId, options);
    }
  }

  /**
   * Validate barcode with authority-level checks
   */
  validateBarcode(barcode: string): BarcodeValidationResult {
    console.log(`🔍 BarcodeAuthority: Validating barcode ${barcode}`);
    
    const validation = this.delegateService.validateBarcode(barcode);
    
    if (this.config.enableTracing) {
      console.log(`🔍 BarcodeAuthority: Validation result for ${barcode}:`, {
        isValid: validation.isValid,
        format: validation.format,
        errors: validation.errors
      });
    }
    
    return validation;
  }

  /**
   * Get barcode data contract for integrity checking
   */
  getBarcodeContract(barcode: string): BarcodeDataContract | null {
    return this.barcodeTrace.get(barcode) || null;
  }

  /**
   * Verify barcode integrity between systems
   */
  verifyBarcodeIntegrity(barcode: string, expectedSource?: string): boolean {
    const contract = this.getBarcodeContract(barcode);
    if (!contract) {
      console.warn(`⚠️ BarcodeAuthority: No contract found for barcode ${barcode}`);
      return false;
    }

    const validation = this.validateBarcode(barcode);
    if (!validation.isValid) {
      console.error(`❌ BarcodeAuthority: Barcode ${barcode} failed validation:`, validation.errors);
      return false;
    }

    if (expectedSource && contract.source !== expectedSource) {
      console.warn(`⚠️ BarcodeAuthority: Source mismatch for ${barcode}. Expected: ${expectedSource}, Got: ${contract.source}`);
    }

    console.log(`✅ BarcodeAuthority: Barcode integrity verified for ${barcode}`);
    return true;
  }

  // Delegate methods to maintain IBarcodeService interface
  async generateBulkBarcodes(requests: Array<{
    entityId: string;
    type: 'unit' | 'product';
    options?: BarcodeGenerationOptions;
  }>): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const request of requests) {
      try {
        const barcode = request.type === 'unit' 
          ? await this.generateUnitBarcode(request.entityId, request.options)
          : await this.generateProductBarcode(request.entityId, request.options);
        
        results[request.entityId] = barcode;
      } catch (error) {
        console.error(`❌ BarcodeAuthority: Bulk generation failed for ${request.entityId}:`, error);
      }
    }
    
    return results;
  }

  parseBarcode(barcode: string): BarcodeValidationResult['parsedData'] {
    return this.delegateService.parseBarcode(barcode);
  }

  async registerBarcode(
    barcode: string,
    barcodeType: 'unit' | 'product',
    entityType: 'product' | 'product_unit',
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<BarcodeRecord> {
    return this.delegateService.registerBarcode(barcode, barcodeType, entityType, entityId, metadata);
  }

  async getBarcodeByEntity(entityType: 'product' | 'product_unit', entityId: string): Promise<BarcodeRecord | null> {
    return this.delegateService.getBarcodeByEntity(entityType, entityId);
  }

  async validateUniqueness(barcode: string): Promise<boolean> {
    return this.delegateService.validateUniqueness(barcode);
  }

  async getBarcodeHistory(entityId: string): Promise<BarcodeRecord[]> {
    return this.delegateService.getBarcodeHistory(entityId);
  }

  async updateConfig(config: {
    prefix: string;
    format: string;
    counters: { unit: number; product: number };
  }): Promise<void> {
    return this.delegateService.updateConfig(config);
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const delegateHealth = await this.delegateService.healthCheck();
    
    return {
      ...delegateHealth,
      details: {
        ...delegateHealth.details,
        authority: 'active',
        traceCount: this.barcodeTrace.size,
        config: this.config
      }
    };
  }

  /**
   * Create barcode data contract with traceability
   */
  private createDataContract(
    barcode: string,
    source: 'existing' | 'generated' | 'fallback',
    entityType: 'product' | 'product_unit',
    entityId: string,
    traceId: string
  ): string {
    // Validate barcode if enabled
    let validation: BarcodeValidationResult = { isValid: true, format: 'CODE128', errors: [] };
    if (this.config.enableValidation) {
      validation = this.validateBarcode(barcode);
      
      if (!validation.isValid) {
        throw new Error(`Generated invalid barcode ${barcode}: ${validation.errors.join(', ')}`);
      }
    }

    // Create and store contract if tracing enabled
    if (this.config.enableTracing) {
      const contract: BarcodeDataContract = {
        barcode,
        source,
        validation,
        traceId,
        timestamp: new Date().toISOString(),
        entityType,
        entityId
      };
      
      this.barcodeTrace.set(barcode, contract);
      console.log(`📝 BarcodeAuthority: Contract created for ${barcode} [${traceId}]`);
    }

    return barcode;
  }

  /**
   * Generate unique trace ID for debugging
   */
  private generateTraceId(type: string, entityId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${type}-${entityId}-${timestamp}-${random}`;
  }

  /**
   * Clear trace data (for memory management)
   */
  clearTrace(): void {
    this.barcodeTrace.clear();
    console.log('🧹 BarcodeAuthority: Trace data cleared');
  }

  /**
   * Get trace statistics
   */
  getTraceStats(): { totalContracts: number; sourceBreakdown: Record<string, number> } {
    const sourceBreakdown: Record<string, number> = {};
    
    for (const contract of this.barcodeTrace.values()) {
      sourceBreakdown[contract.source] = (sourceBreakdown[contract.source] || 0) + 1;
    }
    
    return {
      totalContracts: this.barcodeTrace.size,
      sourceBreakdown
    };
  }
}

// Global singleton instance
let authorityInstance: BarcodeAuthorityService | null = null;

/**
 * Get the global barcode authority instance
 */
export function getBarcodeAuthority(): BarcodeAuthorityService {
  if (!authorityInstance) {
    authorityInstance = new BarcodeAuthorityService();
  }
  return authorityInstance;
}

/**
 * Reset the barcode authority (for testing)
 */
export function resetBarcodeAuthority(): void {
  authorityInstance = null;
}