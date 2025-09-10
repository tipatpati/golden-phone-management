import React from "react";
import type { SerialNumberManagerProps } from "@/services/inventory/types";
import { UnitEntryForm } from "@/components/shared/forms/UnitEntryForm";
import { UniversalBarcodeManager } from "@/components/shared/UniversalBarcodeManager";

export function SerialNumberManager({
  serialNumbers, // optional legacy
  unitEntries,
  onUnitEntriesChange,
  onStockChange,
  hasSerial,
  productId,
  productBrand,
  productModel,
  onBarcodeGenerated
}: SerialNumberManagerProps & { 
  productBrand?: string; 
  productModel?: string;
  onBarcodeGenerated?: (barcode: string) => void;
}) {
  if (!hasSerial) {
    return null;
  }

  // Use provided product info or fallback to defaults
  const productInfo = {
    brand: productBrand || 'Unknown',
    model: productModel || 'Unknown'
  };

  return (
    <div className="space-y-4">
      <UnitEntryForm
        entries={unitEntries}
        setEntries={onUnitEntriesChange}
        onStockChange={onStockChange}
        title="Product Units (IMEI/SN + attributes)"
        showPricing={true}
      />
      
      <UniversalBarcodeManager
        productId={productId}
        productBrand={productInfo.brand}
        productModel={productInfo.model}
        units={unitEntries}
        source="inventory"
        showPrintButton={true}
        onBarcodeGenerated={(serial, barcode) => {
          console.log(`✅ Generated barcode for unit ${serial}: ${barcode}`);
          // Update the first unit's barcode for product-level barcode field
          if (unitEntries.length > 0 && onBarcodeGenerated) {
            onBarcodeGenerated(barcode);
          }
        }}
        onPrintCompleted={(printedUnits) => {
          console.log(`✅ Printed labels for inventory units: ${printedUnits.join(', ')}`);
        }}
      />
      
      <p className="text-xs text-muted-foreground">
        Use "Add New Unit" to add structured unit details (serial, prices, battery, color). 
        Stock updates automatically based on entries.
      </p>
    </div>
  );
}
