/**
 * Barcode Service Interfaces
 * Defines contracts for barcode generation and management services
 */

export interface BarcodeGenerationOptions {
  prefix?: string;
  metadata?: Record<string, any>;
  format?: 'CODE128' | 'EAN13' | 'CODE39';
}

export interface BarcodeValidationResult {
  isValid: boolean;
  format?: string;
  errors?: string[];
  parsedData?: {
    prefix: string;
    type: 'unit' | 'product' | 'unknown';
    counter: number;
  };
}

export interface BarcodeRecord {
  id: string;
  barcode: string;
  barcode_type: 'unit' | 'product';
  entity_type: 'product' | 'product_unit';
  entity_id: string;
  format: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for barcode generation services
 */
export interface IBarcodeGenerator {
  /**
   * Generate a unique barcode for a product unit
   */
  generateUnitBarcode(unitId: string, options?: BarcodeGenerationOptions): Promise<string>;
  
  /**
   * Generate a unique barcode for a product
   */
  generateProductBarcode(productId: string, options?: BarcodeGenerationOptions): Promise<string>;
  
  /**
   * Generate multiple barcodes in bulk
   */
  generateBulkBarcodes(requests: Array<{
    entityId: string;
    type: 'unit' | 'product';
    options?: BarcodeGenerationOptions;
  }>): Promise<Record<string, string>>;
  
  /**
   * Validate barcode format and content
   */
  validateBarcode(barcode: string): BarcodeValidationResult;
  
  /**
   * Parse barcode information
   */
  parseBarcode(barcode: string): BarcodeValidationResult['parsedData'];
}

/**
 * Interface for barcode registry management
 */
export interface IBarcodeRegistry {
  /**
   * Register a barcode in the system
   */
  registerBarcode(
    barcode: string,
    barcodeType: 'unit' | 'product',
    entityType: 'product' | 'product_unit',
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<BarcodeRecord>;
  
  /**
   * Get barcode record by entity
   */
  getBarcodeByEntity(entityType: 'product' | 'product_unit', entityId: string): Promise<BarcodeRecord | null>;
  
  /**
   * Check if barcode is unique
   */
  validateUniqueness(barcode: string): Promise<boolean>;
  
  /**
   * Get barcode history for an entity
   */
  getBarcodeHistory(entityId: string): Promise<BarcodeRecord[]>;
  
  /**
   * Update barcode configuration
   */
  updateConfig(config: {
    prefix: string;
    format: string;
    counters: { unit: number; product: number };
  }): Promise<void>;
}

/**
 * Combined barcode service interface
 */
export interface IBarcodeService extends IBarcodeGenerator, IBarcodeRegistry {
  /**
   * Get or generate barcode for entity
   */
  getOrGenerateBarcode(
    entityType: 'product' | 'product_unit',
    entityId: string,
    barcodeType: 'unit' | 'product',
    options?: BarcodeGenerationOptions
  ): Promise<string>;
  
  /**
   * Health check for barcode service
   */
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }>;
}