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
  productId
}: SerialNumberManagerProps) {
  if (!hasSerial) {
    return null;
  }

  // For inventory forms, try to extract product info for barcode manager
  const getProductInfo = () => {
    // This would need to be passed down or fetched, for now use defaults
    return {
      brand: 'Unknown',
      model: 'Unknown'
    };
  };

  const productInfo = getProductInfo();

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
