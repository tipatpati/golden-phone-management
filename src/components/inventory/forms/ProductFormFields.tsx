import React from "react";
import { FormField } from "@/components/common/FormField";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Label } from "@/components/ui/label";
import { ProductFormData, STORAGE_OPTIONS } from "./types";
import { CATEGORY_OPTIONS } from "@/services/inventory/types";

interface ProductFormFieldsProps {
  formData: Partial<ProductFormData>;
  onFieldChange: (field: keyof ProductFormData, value: any) => void;
  getFieldError: (field: string) => string | undefined;
  uniqueBrands?: string[];
  uniqueModels?: string[];
}

export function ProductFormFields({
  formData,
  onFieldChange,
  getFieldError,
  uniqueBrands = [],
  uniqueModels = []
}: ProductFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Brand Field */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-on-surface">
          Brand <span className="text-destructive ml-1">*</span>
        </Label>
        <AutocompleteInput
          value={formData.brand || ''}
          onChange={(value) => onFieldChange('brand', value)}
          suggestions={uniqueBrands}
          placeholder="Enter product brand"
        />
        {getFieldError('brand') && (
          <p className="text-xs text-destructive">{getFieldError('brand')}</p>
        )}
      </div>

      {/* Model Field */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-on-surface">
          Model <span className="text-destructive ml-1">*</span>
        </Label>
        <AutocompleteInput
          value={formData.model || ''}
          onChange={(value) => onFieldChange('model', value)}
          suggestions={uniqueModels}
          placeholder="Enter product model"
        />
        {getFieldError('model') && (
          <p className="text-xs text-destructive">{getFieldError('model')}</p>
        )}
      </div>

      {/* Year Field */}
      <FormField
        label="Year"
        type="input"
        inputType="number"
        value={formData.year?.toString() || ''}
        onChange={(value) => onFieldChange('year', value ? parseInt(value) : undefined)}
        placeholder="2023"
        className="md:col-span-1"
        error={getFieldError('year')}
      />

      {/* Category Field */}
      <FormField
        label="Category"
        type="select"
        value={formData.category_id?.toString() || '1'}
        onChange={(value) => onFieldChange('category_id', parseInt(value) || 1)}
        options={CATEGORY_OPTIONS.map(cat => ({ 
          value: cat.id.toString(), 
          label: cat.name 
        }))}
        required
        className="md:col-span-1"
        error={getFieldError('category_id')}
      />

      {/* Default Price Field - Optional for new units */}
      <FormField
        label="Default Base Price (€)"
        type="input"
        inputType="number"
        value={formData.price?.toString() || ''}
        onChange={(value) => onFieldChange('price', value ? parseFloat(value) : undefined)}
        placeholder="0.00"
        description="Optional default purchase price for new units"
        className="md:col-span-1"
        error={getFieldError('price')}
      />

      {/* Default Min Price Field - Optional for new units */}
      <FormField
        label="Default Min Selling Price (€)"
        type="input"
        inputType="number"
        value={formData.min_price?.toString() || ''}
        onChange={(value) => onFieldChange('min_price', value ? parseFloat(value) : undefined)}
        placeholder="0.00"
        description="Optional default minimum selling price for new units"
        className="md:col-span-1"
        error={getFieldError('min_price')}
      />

      {/* Default Max Price Field - Optional for new units */}
      <FormField
        label="Default Max Selling Price (€)"
        type="input"
        inputType="number"
        value={formData.max_price?.toString() || ''}
        onChange={(value) => onFieldChange('max_price', value ? parseFloat(value) : undefined)}
        placeholder="0.00"
        description="Optional default maximum selling price for new units"
        className="md:col-span-1"
        error={getFieldError('max_price')}
      />

      {/* Pricing Information Guide */}
      <div className="md:col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-900 mb-2">💰 Pricing Strategy</h4>
        <div className="text-xs text-yellow-800 space-y-1">
          <p><strong>✅ Unit-Level Pricing (Recommended):</strong> Set individual prices for each IMEI/serial number below</p>
          <p><strong>📋 Default Prices (Optional):</strong> These will apply only to new units without specific pricing</p>
          <p><strong>🎯 Best Practice:</strong> Leave default fields empty and set specific prices for each unit individually</p>
          <p className="mt-2 font-medium text-yellow-700">⚡ For products with serial numbers: Unit prices are required, default prices are optional</p>
          <p className="text-yellow-700">⚡ For products without serial numbers: At least one default price is required</p>
        </div>
      </div>

      {/* Stock Field - Only show if not using serial numbers */}
      {!formData.has_serial && (
        <FormField
          label="Stock"
          type="input"
          inputType="number"
          value={formData.stock?.toString() || ''}
          onChange={(value) => onFieldChange('stock', value ? parseInt(value) : 0)}
          placeholder="0"
          required
          className="md:col-span-1"
          error={getFieldError('stock')}
        />
      )}

      {/* Threshold Field */}
      <FormField
        label="Low Stock Threshold"
        type="input"
        inputType="number"
        value={formData.threshold?.toString() || ''}
        onChange={(value) => {
          const num = parseInt(value) || 0;
          if (num >= 0) { // Only allow natural numbers (0 and positive integers)
            onFieldChange('threshold', num);
          }
        }}
        placeholder="5"
        required
        className="md:col-span-1"
        error={getFieldError('threshold')}
      />


      {/* Description Field */}
      <FormField
        label="Description"
        type="textarea"
        value={formData.description || ''}
        onChange={(value) => onFieldChange('description', value)}
        placeholder="Product description..."
        className="md:col-span-2"
        rows={2}
        error={getFieldError('description')}
      />

      {/* Supplier Field */}
      <FormField
        label="Supplier"
        type="input"
        value={formData.supplier || ''}
        onChange={(value) => onFieldChange('supplier', value)}
        placeholder="Supplier name"
        className="md:col-span-2"
        error={getFieldError('supplier')}
      />

      {/* Barcode Field - Only for products without serial numbers */}
      {!formData.has_serial && (
        <FormField
          label="Product Barcode"
          type="input"
          value={formData.barcode || ''}
          onChange={(value) => onFieldChange('barcode', value)}
          placeholder="Enter or scan barcode"
          className="md:col-span-2"
          description="For bulk products without individual serial numbers"
          error={getFieldError('barcode')}
        />
      )}

      {/* Barcode Information Guide */}
      <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">📦 Barcode Information</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p><strong>Products with Serial Numbers:</strong> Each unit gets its own unique barcode automatically</p>
          <p><strong>Bulk Products:</strong> Single barcode for the entire product (editable above)</p>
          <p><strong>Format:</strong> System uses CODE128 format for maximum compatibility</p>
          <p className="mt-2 text-blue-700">💡 Barcodes can be updated after product creation using the barcode management tools</p>
        </div>
      </div>
    </div>
  );
}