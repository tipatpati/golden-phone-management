// Inventory UI Components Library
// Centralized exports for all inventory-specific UI components

export { InventoryCard } from "./InventoryCard";
export { BarcodeDisplay } from "./BarcodeDisplay";
export { InventoryMetrics } from "./InventoryMetrics";

// Re-export form components for convenience
export { ProductForm } from "../forms/ProductForm";
export { ProductFormFields } from "../forms/ProductFormFields";
export { SerialNumberManager } from "../forms/SerialNumberManager";
export { BarcodeManager } from "../forms/BarcodeManager";

// Re-export types
export type { ProductFormData, SerialEntry } from "../forms/types";

// Re-export hooks
export { useProductForm } from "../forms/hooks/useProductForm";
export { useProductValidation } from "../forms/hooks/useProductValidation";
export { useInventoryServices } from "../forms/hooks/useInventoryServices";
