import React from "react";
import { ProductForm } from "./forms/ProductForm";
import { BarcodeManager } from "./forms/BarcodeManager";
import { SerialNumberManager } from "./forms/SerialNumberManager";
import { useProductForm } from "./forms/hooks/useProductForm";

/**
 * Legacy EditProductForm component
 * This is now a thin wrapper around the new modular architecture
 * Maintains backward compatibility while using the new system
 */
export { EditProductDialog as EditProductForm } from "./EditProductDialog";