import React from "react";
import type { ProductFormProps, ProductFormData } from "@/services/inventory/types";
import { ProductFormFields } from "./ProductFormFields";
import { SerialNumberManager } from "./SerialNumberManager";
import { useProductForm } from "./hooks/useProductForm";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";

export function ProductForm({ 
  initialData, 
  onSubmit, 
  isLoading, 
  submitText = "Save Product",
  onRegisterSubmit,
  productId
}: ProductFormProps) {
  const {
    formData,
    unitEntries,
    isSubmitting,
    updateField,
    updateUnitEntries,
    handleSubmit,
    getFieldError,
    hasErrors
  } = useProductForm({ initialData, onSubmit });

  React.useEffect(() => {
    if (onRegisterSubmit) {
      onRegisterSubmit(handleSubmit);
    }
  }, [handleSubmit, onRegisterSubmit]);

  // Expose handleSubmit to parent components for FormDialog
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

      {/* Product Form Guidance */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">📋 Adding Products Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-800">
          <div>
            <p className="font-medium mb-1">📦 Product Information:</p>
            <ul className="space-y-1 list-disc list-inside pl-2">
              <li>Brand and Model are required</li>
              <li>Set price range (min/max prices)</li>
              <li>Choose appropriate category</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">🔢 Serial Numbers:</p>
            <ul className="space-y-1 list-disc list-inside pl-2">
              <li>Add IMEI/Serial for each unit</li>
              <li>Include color and battery level</li>
              <li>Stock calculated automatically</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">📊 Barcodes:</p>
            <ul className="space-y-1 list-disc list-inside pl-2">
              <li>EAN13 (13 digits) preferred</li>
              <li>CODE128 for complex formats</li>
              <li>Auto-generated from serials</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">⚡ Quick Tips:</p>
            <ul className="space-y-1 list-disc list-inside pl-2">
              <li>Use barcode scanner for existing items</li>
              <li>Set low stock threshold</li>
              <li>Add supplier for tracking</li>
            </ul>
          </div>
        </div>
      </div>
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
          unitEntries={unitEntries}
          onUnitEntriesChange={updateUnitEntries}
          onStockChange={(stock) => updateField('stock', stock)}
          hasSerial={formData.has_serial}
          productId={productId}
          productBrand={formData.brand}
          productModel={formData.model}
          onBarcodeGenerated={React.useCallback((barcode) => updateField('barcode', barcode), [updateField])}
        />
      )}


      {/* Form-level error display - Show all validation errors */}
      {React.useMemo(() => {
        const allErrors = [];
        const fields = ['brand', 'model', 'category_id', 'price', 'min_price', 'max_price', 'threshold', 'serial_numbers'];
        
        for (const field of fields) {
          const error = getFieldError(field);
          if (error) {
            allErrors.push({ field, error });
          }
        }
        
        if (allErrors.length > 0) {
          return (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="text-sm font-semibold text-destructive mb-2">Please fix these errors:</h4>
              <ul className="space-y-1">
                {allErrors.map(({ field, error }) => (
                  <li key={field} className="text-sm text-destructive">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        return null;
      }, [getFieldError])}

    </div>
  );
}