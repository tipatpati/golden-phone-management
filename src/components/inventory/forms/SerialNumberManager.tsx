import React from "react";
import { SerialNumberManagerProps } from "./types";
import { SerialNumbersInput } from "../SerialNumbersInput";

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
      <SerialNumbersInput
        entries={unitEntries}
        setEntries={onUnitEntriesChange}
        setStock={(value: string) => {
          const stock = Array.isArray(unitEntries)
            ? unitEntries.filter(e => e.serial?.trim()).length
            : 0;
          onStockChange(stock);
        }}
      />
      
      <p className="text-xs text-muted-foreground">
        Use "Add New Unit" to add structured unit details (serial, prices, battery, color). 
        Stock updates automatically based on entries.
      </p>
    </div>
  );
}
