import React from "react";
import type { SerialNumberManagerProps } from "@/services/inventory/types";
import { UnitEntryForm } from "@/components/shared/forms/UnitEntryForm";
import { UnitBarcodeManager } from "@/components/shared/forms/UnitBarcodeManager";

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

  return (
    <div className="space-y-4">
      <UnitEntryForm
        entries={unitEntries}
        setEntries={onUnitEntriesChange}
        onStockChange={onStockChange}
        title="Product Units (IMEI/SN + attributes)"
        showPricing={true}
      />
      
      <UnitBarcodeManager
        units={unitEntries}
        productId={productId}
        showPrintButton={true}
      />
      
      <p className="text-xs text-muted-foreground">
        Use "Add New Unit" to add structured unit details (serial, prices, battery, color). 
        Stock updates automatically based on entries.
      </p>
    </div>
  );
}
