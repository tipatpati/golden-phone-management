// SINGLE SOURCE OF TRUTH: All barcode operations must go through these services
export { BarcodeRegistryService, type BarcodeRecord, type BarcodeConfig } from './BarcodeRegistryService';
export { Code128GeneratorService, type Code128Options, type BarcodeValidationResult } from './Code128GeneratorService';

// Legacy compatibility - DO NOT USE, use services above
export { Code128GeneratorService as BarcodeGeneratorService } from './Code128GeneratorService';