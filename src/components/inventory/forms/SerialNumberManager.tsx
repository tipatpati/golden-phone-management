import React from "react";
import type { SerialNumberManagerProps } from "@/services/inventory/types";
import { UnitEntryForm } from "@/components/shared/forms/UnitEntryForm";
import { UniversalBarcodeManager } from "@/components/shared/UniversalBarcodeManager";
import { logger } from '@/utils/logger';
import { getCategoryFieldConfig } from '@/utils/categoryUtils';

export function SerialNumberManager({
  serialNumbers, // optional legacy
  unitEntries,
  onUnitEntriesChange,
  onStockChange,
  hasSerial,
  productId,
  productBrand,
  productModel,
  onBarcodeGenerated,
  onDefaultPricesUpdate,
  categoryId
}: SerialNumberManagerProps & { 
  productBrand?: string; 
  productModel?: string;
  onBarcodeGenerated?: (barcode: string) => void;
  onDefaultPricesUpdate?: (defaults: { price?: number; min_price?: number; max_price?: number }, templateName?: string) => void;
  categoryId?: number;
}) {
  if (!hasSerial) {
    return null;
  }

  // Use provided product info or fallback to defaults
  const productInfo = {
    brand: productBrand || 'Unknown',
    model: productModel || 'Unknown'
  };

  // Get category-specific field configuration
  const fieldConfig = getCategoryFieldConfig(categoryId);

  return (
    <div className="space-y-4">
      <UnitEntryForm
        entries={unitEntries}
        setEntries={onUnitEntriesChange}
        onStockChange={onStockChange}
        onDefaultPricesUpdate={onDefaultPricesUpdate}
        title="Product Units (IMEI/SN + attributes)"
        showPricing={true}
        showPricingTemplates={true}
        categoryFieldConfig={fieldConfig}
      />
      
      <UniversalBarcodeManager
        productId={productId}
        productBrand={productInfo.brand}
        productModel={productInfo.model}
        units={unitEntries}
        source="inventory"
        showPrintButton={true}
        onBarcodeGenerated={(serial, barcode) => {
          logger.info('Generated barcode for unit', { serial, barcode }, 'SerialNumberManager');
          // Update the first unit's barcode for product-level barcode field
          if (unitEntries.length > 0 && onBarcodeGenerated) {
            onBarcodeGenerated(barcode);
          }
        }}
        onPrintCompleted={(printedUnits) => {
          logger.info('Printed labels for inventory units', { printedUnits }, 'SerialNumberManager');
        }}
      />
      
      <p className="text-xs text-muted-foreground">
        Use "Add New Unit" to add structured unit details (serial, prices, battery, color). 
        Stock updates automatically based on entries.
      </p>
    </div>
  );
}
