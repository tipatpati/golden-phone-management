import React from "react";
import { FormField } from "./ProductFormFields";
import { Label } from "@/components/ui/label";
import { AutocompleteInput } from "@/components/shared/AutocompleteInput";
import { useEnhancedBrandSuggestions, useModelSuggestions } from "@/hooks/useProductNameSuggestions";
import type { ProductFormData } from "@/services/inventory/types";

interface ProductFormFieldsProps {
  formData: Partial<ProductFormData>;
  onFieldChange: (field: keyof ProductFormData, value: any) => void;
  getFieldError: (field: string) => string;
  uniqueBrands: string[];
  uniqueModels: string[];
  templateAppliedDefaults?: {
    templateName?: string;
    price?: number;
    min_price?: number;
    max_price?: number;
  } | null;
  isSuperAdmin?: boolean;
}

export function ProductFormFields({
  formData,
  onFieldChange,
  getFieldError,
  uniqueBrands,
  uniqueModels,
  templateAppliedDefaults,
  isSuperAdmin = false
}: ProductFormFieldsProps) {
  // Super admins can edit any product, or non-serialized products can be edited
  const isStockEditable = isSuperAdmin || !formData.has_serial;

  // Get brand and model suggestions
  const { brandSuggestions } = useEnhancedBrandSuggestions();
  const { modelSuggestions } = useModelSuggestions(formData.brand, formData.category_id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brand Field with Autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-sm font-medium flex items-center gap-1">
            Brand
            <span className="text-destructive">*</span>
          </Label>
          <AutocompleteInput
            value={formData.brand || ""}
            onChange={(value) => onFieldChange("brand", value)}
            suggestions={brandSuggestions}
            entityTypes={[]} // Disable dynamic search, use static suggestions only
            placeholder="e.g., Apple, Samsung"
            className={getFieldError("brand") ? "border-destructive" : ""}
          />
          {getFieldError("brand") && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <span className="inline-block w-1 h-1 bg-destructive rounded-full"></span>
              {getFieldError("brand")}
            </p>
          )}
        </div>

        {/* Model Field with Autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="model" className="text-sm font-medium flex items-center gap-1">
            Model
            <span className="text-destructive">*</span>
          </Label>
          <AutocompleteInput
            value={formData.model || ""}
            onChange={(value) => onFieldChange("model", value)}
            suggestions={modelSuggestions}
            entityTypes={[]} // Disable dynamic search
            placeholder={
              !formData.brand
                ? "Select brand first"
                : !formData.category_id
                ? "Select category first"
                : "e.g., iPhone 13"
            }
            disabled={!formData.brand || !formData.category_id}
            className={getFieldError("model") ? "border-destructive" : ""}
          />
          {getFieldError("model") && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <span className="inline-block w-1 h-1 bg-destructive rounded-full"></span>
              {getFieldError("model")}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Category"
          type="select"
          value={formData.category_id?.toString()}
          onChange={(value) => onFieldChange("category_id", parseInt(value))}
          placeholder="Select a category"
          options={[
            { value: "1", label: "Smartphones" },
            { value: "2", label: "Tablets" },
            { value: "3", label: "Laptops" },
            { value: "4", label: "Accessories" }
          ]}
          error={getFieldError("category_id")}
          required
        />

        <FormField
          label="Product Status"
          type="select"
          value={(formData as any).status || "active"}
          onChange={(value) => onFieldChange("status" as any, value)}
          placeholder="Select status"
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" }
          ]}
          error={getFieldError("status")}
        />
      </div>

      <FormField
        label="Description"
        type="textarea"
        value={formData.description || ""}
        onChange={(value) => onFieldChange("description", value)}
        placeholder="Product description..."
        rows={3}
        error={getFieldError("description")}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          label="Price"
          type="input"
          inputType="number"
          value={formData.price?.toString() || ""}
          onChange={(value) => onFieldChange("price", parseFloat(value) || 0)}
          placeholder="0.00"
          error={getFieldError("price")}
          required
        />

        <FormField
          label="Min Price"
          type="input"
          inputType="number"
          value={formData.min_price?.toString() || ""}
          onChange={(value) => onFieldChange("min_price", parseFloat(value) || 0)}
          placeholder="0.00"
          error={getFieldError("min_price")}
        />

        <FormField
          label="Max Price"
          type="input"
          inputType="number"
          value={formData.max_price?.toString() || ""}
          onChange={(value) => onFieldChange("max_price", parseFloat(value) || 0)}
          placeholder="0.00"
          error={getFieldError("max_price")}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Only show Stock field for non-serialized products or super admins */}
        {(!formData.has_serial || isSuperAdmin) && (
          <FormField
            label="Stock"
            type="input"
            inputType="number"
            value={formData.stock?.toString() || "0"}
            onChange={(value) => onFieldChange("stock", parseInt(value) || 0)}
            placeholder="0"
            error={getFieldError("stock")}
            description={
              formData.has_serial 
                ? "Auto-calculated from serial numbers" + (isSuperAdmin ? " (Super Admin can override)" : "")
                : "Manually set stock quantity"
            }
            disabled={formData.has_serial && !isSuperAdmin}
          />
        )}
        
        <FormField
          label="Low Stock Threshold"
          type="input"
          inputType="number"
          value={formData.threshold?.toString() || "0"}
          onChange={(value) => onFieldChange("threshold", parseInt(value) || 0)}
          placeholder="0"
          error={getFieldError("threshold")}
          description="Get alerts when stock falls below this number"
        />
      </div>

      {isSuperAdmin && formData.has_serial && isStockEditable && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ⚠️ <strong>Super Admin Override:</strong> Stock is normally auto-calculated from units
          </p>
        </div>
      )}

      {templateAppliedDefaults && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Template "{templateAppliedDefaults.templateName}" prices applied
          </p>
        </div>
      )}
    </div>
  );
}
