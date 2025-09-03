import React from "react";
import { FormField } from "@/components/common/FormField";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Label } from "@/components/ui/label";
import { CATEGORY_OPTIONS, ProductFormData, STORAGE_OPTIONS } from "./types";

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

      {/* Price Field */}
      <FormField
        label="Price (€)"
        type="input"
        inputType="number"
        value={formData.price?.toString() || '0'}
        onChange={(value) => onFieldChange('price', value ? parseFloat(value) : 0)}
        placeholder="0.00"
        required
        className="md:col-span-1"
        error={getFieldError('price')}
      />

      {/* Min Price Field */}
      <FormField
        label="Min Price (€)"
        type="input"
        inputType="number"
        value={formData.min_price?.toString() || '0'}
        onChange={(value) => onFieldChange('min_price', value ? parseFloat(value) : 0)}
        placeholder="0.00"
        required
        className="md:col-span-1"
        error={getFieldError('min_price')}
      />

      {/* Max Price Field */}
      <FormField
        label="Max Price (€)"
        type="input"
        inputType="number"
        value={formData.max_price?.toString() || '0'}
        onChange={(value) => onFieldChange('max_price', value ? parseFloat(value) : 0)}
        placeholder="0.00"
        required
        className="md:col-span-1"
        error={getFieldError('max_price')}
      />

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

      {/* Storage Field */}
      <FormField
        label="Storage"
        type="select"
        value={formData.storage?.toString() || 'none'}
        onChange={(value) => onFieldChange('storage', value === 'none' ? undefined : parseInt(value))}
        options={[
          { value: 'none', label: 'Select storage' },
          ...STORAGE_OPTIONS.map(opt => ({ 
            value: opt.value.toString(), 
            label: opt.label 
          }))
        ]}
        className="md:col-span-1"
        error={getFieldError('storage')}
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

      {/* Barcode Information Guide */}
      <div className="md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">📦 Barcode Information</h4>
        <div className="text-xs text-blue-800 space-y-1">
          <p><strong>EAN13 (International Standard):</strong> 13 digits exactly (e.g., 1234567890123)</p>
          <p><strong>CODE128:</strong> Any alphanumeric text, used when EAN13 isn't suitable</p>
          <p><strong>Auto-generation:</strong> Barcodes will be automatically generated based on serial numbers or product info</p>
          <p className="mt-2 text-blue-700">💡 The system will automatically choose the best format for your barcode</p>
        </div>
      </div>
    </div>
  );
}