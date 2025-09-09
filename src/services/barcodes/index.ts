// LEGACY BARREL EXPORTS - REDIRECTED TO NEW SERVICE SYSTEM
// These re-exports delegate to the new injectable service system for consistency

export { 
  Code128GeneratorService, 
  BarcodeRegistryService, 
  ThermalLabelService 
} from '../core/ServiceMigration';

// Type exports for compatibility
export type { Code128Options, BarcodeValidationResult } from './Code128GeneratorService';
export type { BarcodeRecord, BarcodeConfig } from './BarcodeRegistryService';

// Legacy compatibility - DO NOT USE, use services above
export { Code128GeneratorService as BarcodeGeneratorService } from '../core/ServiceMigration';