import React from "react";
import { SerialNumberManagerProps } from "./types";
import { SerialNumbersInput } from "../SerialNumbersInput";

export function SerialNumberManager({
  serialNumbers,
  onSerialNumbersChange,
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
        serialNumbers={serialNumbers}
        setSerialNumbers={onSerialNumbersChange}
        setStock={() => {}} // Remove stock callback to prevent loops
      />
      
      <p className="text-xs text-muted-foreground">
        Use "Add New Unit" button above to add new serial numbers to this product. 
        Stock will update automatically based on the number of serial entries.
      </p>
    </div>
  );
}