// Central exports for the inventory management system
export { InventoryManagementService } from './InventoryManagementService';
export type * from './types';

// Re-export commonly used types for convenience
export type {
  Product,
  ProductUnit,
  ProductFormData,
  UnitEntryForm,
  CreateProductData,
  CreateProductUnitData,
  ProductWithUnits,
  InventoryOperationResult
} from './types';