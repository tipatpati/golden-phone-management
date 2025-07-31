import React from "react";
import { ProductFormProps } from "./types";
import { ProductFormFields } from "./ProductFormFields";
import { SerialNumberManager } from "./SerialNumberManager";
import { BarcodeManager } from "./BarcodeManager";
import { useProductForm } from "./hooks/useProductForm";
import { useProducts } from "@/services/products/ProductReactQueryService";

export function ProductForm({ 
  initialData, 
  onSubmit, 
  isLoading, 
  submitText = "Save Product" 
}: ProductFormProps) {
  const {
    formData,
    serialNumbers,
    isSubmitting,
    updateField,
    updateSerialNumbers,
    handleSubmit,
    getFieldError
  } = useProductForm({ initialData, onSubmit });

  // Expose handleSubmit to parent components
  React.useEffect(() => {
    (window as any).__currentFormSubmit = handleSubmit;
    return () => {
      (window as any).__currentFormSubmit = null;
    };
  }, [handleSubmit]);

  const { data: products } = useProducts();

  // Get unique brands and models for autocomplete
  const uniqueBrands = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const brands = new Set(
      products
        .map(p => p.brand)
        .filter(Boolean)
        .map(brand => brand.replace(/\s*\([^)]*\)/, '').trim()) // Remove color info
    );
    return Array.from(brands) as string[];
  }, [products]);

  const uniqueModels = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const models = new Set(products.map(p => p.model).filter(Boolean));
    return Array.from(models) as string[];
  }, [products]);

  // Check if category requires serial numbers
  const requiresSerial = formData.category_id !== 2;

  return (
    <div className="space-y-6">
      {/* Basic Product Information */}
      <ProductFormFields
        formData={formData}
        onFieldChange={updateField}
        getFieldError={getFieldError}
        uniqueBrands={uniqueBrands}
        uniqueModels={uniqueModels}
      />

      {/* Serial Number Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="has-serial"
          checked={formData.has_serial}
          onChange={(e) => updateField('has_serial', e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="has-serial" className="text-sm font-medium">
          This product has serial numbers
        </label>
        {requiresSerial && (
          <span className="text-xs text-muted-foreground">
            (Required for this category)
          </span>
        )}
      </div>

      {/* Category-specific notice */}
      {!requiresSerial && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This category allows products without serial numbers. 
            You can leave the serial numbers field empty if needed.
          </p>
        </div>
      )}

      {/* Serial Number Management */}
      {formData.has_serial && (
        <SerialNumberManager
          serialNumbers={serialNumbers}
          onSerialNumbersChange={updateSerialNumbers}
          onStockChange={(stock) => updateField('stock', stock)}
          hasSerial={formData.has_serial}
          productId={initialData?.barcode}
        />
      )}

      {/* Barcode Display */}
      <BarcodeManager
        serialNumbers={serialNumbers}
        hasSerial={formData.has_serial || false}
        productId={initialData?.barcode}
        onBarcodeGenerated={(barcode) => updateField('barcode', barcode)}
      />

      {/* Form-level error display */}
      {getFieldError('serial_numbers') && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{getFieldError('serial_numbers')}</p>
        </div>
      )}
    </div>
  );
}