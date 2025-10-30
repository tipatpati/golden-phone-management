import React from "react";
import { FormField } from "./ProductFormFields";
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
  const isStockEditable = isSuperAdmin && !formData.has_serial;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Brand"
          type="input"
          value={formData.brand || ""}
          onChange={(value) => onFieldChange("brand", value)}
          placeholder="e.g., Apple, Samsung"
          error={getFieldError("brand")}
          required
        />
        
        <FormField
          label="Model"
          type="input"
          value={formData.model || ""}
          onChange={(value) => onFieldChange("model", value)}
          placeholder="e.g., iPhone 13"
          error={getFieldError("model")}
          required
        />
      </div>

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
