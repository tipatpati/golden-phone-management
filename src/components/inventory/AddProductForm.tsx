import React from "react";
import { AddProductDialog } from "./AddProductDialog";

/**
 * Legacy AddProductForm component  
 * This is now a thin wrapper around the new modular architecture
 * Maintains backward compatibility while using the new system
 */
export { AddProductDialog as AddProductForm } from "./AddProductDialog";