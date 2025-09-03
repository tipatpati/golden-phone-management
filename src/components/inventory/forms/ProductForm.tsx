import React from "react";
import { ProductFormProps, ProductFormData } from "./types";
import { ProductFormFields } from "./ProductFormFields";
import { SerialNumberManager } from "./SerialNumberManager";
import { BarcodeManager } from "./BarcodeManager";
import { useProductForm } from "./hooks/useProductForm";
import { useProducts } from "@/services/products/ProductReactQueryService";

export function ProductForm({ 
  initialData, 
  onSubmit, 
  isLoading, 
  submitText = "Save Product",
  onRegisterSubmit
}: ProductFormProps) {
  const {
    formData,
    serialNumbers,
    isSubmitting,
    updateField,
    updateSerialNumbers,
    handleSubmit,
    getFieldError,
    hasErrors
  } = useProductForm({ initialData, onSubmit });

  React.useEffect(() => {
    if (onRegisterSubmit) {
      onRegisterSubmit(handleSubmit);
    }
  }, [handleSubmit, onRegisterSubmit]);

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

  // Auto-fill function for testing
  const autoFillTestData = () => {
    const testData = {
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      year: 2024,
      category_id: 1, // Phones
      price: 1200,
      min_price: 1000,
      max_price: 1400,
      stock: 3,
      threshold: 5,
      description: 'Latest iPhone with advanced features',
      supplier: 'Tech Supplier Inc',
      has_serial: true
    };

    // Update all fields
    Object.entries(testData).forEach(([key, value]) => {
      updateField(key as keyof ProductFormData, value);
    });

    // Add sample serial numbers
    const sampleSerials = [
      '123456789012345 Space Black 256GB 85%',
      '123456789012346 Natural Titanium 256GB 92%',
      '123456789012347 White Titanium 128GB 78%'
    ].join('\n');
    
    updateSerialNumbers(sampleSerials);
  };

  return (
    <div className="space-y-6">
      {/* Development Auto-fill Button - Always visible for testing */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-yellow-800">🧪 Development Tools</h4>
              <p className="text-xs text-yellow-700">Quick fill for testing purposes</p>
            </div>
            <button
              type="button"
              onClick={autoFillTestData}
              className="px-3 py-1 text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded transition-colors"
            >
              Auto-fill Test Data
            </button>
          </div>
        </div>
      )

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

      {/* Debug Information (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs space-y-2">
          <h4 className="font-semibold">Debug Info:</h4>
          <div>
            <strong>Form Data:</strong>
            <pre className="mt-1 text-[10px] overflow-auto max-h-32">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
          <div>
            <strong>Serial Numbers:</strong> "{serialNumbers}"
          </div>
          <div>
            <strong>Has Errors:</strong> {hasErrors ? 'Yes' : 'No'}
          </div>
        </div>
      )}
    </div>
  );
}