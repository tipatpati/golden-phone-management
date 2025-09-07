// ============================================
// INVENTORY MODULE - SINGLE SOURCE OF TRUTH
// ============================================
// Central exports for the unified inventory management system

export { InventoryManagementService } from './InventoryManagementService';
export { ProductUnitsService } from './ProductUnitsService';
export { StockCalculationService } from './StockCalculationService';
export { InventoryError, handleInventoryError, ERROR_CODES } from './errors';
export type * from './types';

// React Query hooks
export * from './InventoryReactQueryService';

// Re-export commonly used types for convenience
export type {
  Product,
  ProductUnit,
  ProductFormData,
  UnitEntryForm,
  CreateProductData,
  CreateProductUnitData,
  ProductWithUnits,
  InventoryOperationResult,
  InventoryError as InventoryErrorType,
  BulkOperationResult,
  Category
} from './types';