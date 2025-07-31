import React, { useMemo } from "react";
import { BarcodeManagerProps, SerialEntry } from "./types";
import { BarcodeGenerator } from "../BarcodeGenerator";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";

export function BarcodeManager({
  serialNumbers,
  hasSerial,
  productId,
  onBarcodeGenerated
}: BarcodeManagerProps) {
  // Generate individual barcodes for each serial number
  const unitBarcodes = useMemo<SerialEntry[]>(() => {
    if (!hasSerial || !serialNumbers.trim()) return [];
    
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
      const parsed = parseSerialWithBattery(line);
      const barcode = generateSKUBasedBarcode(parsed.serial, productId, parsed.batteryLevel);
      return {
        serial: line.trim(),
        color: parsed.color,
        batteryLevel: parsed.batteryLevel,
        barcode: barcode,
        index: index
      };
    });
  }, [serialNumbers, productId, hasSerial]);

  // Notify parent of first barcode generated
  React.useEffect(() => {
    if (unitBarcodes.length > 0 && onBarcodeGenerated) {
      onBarcodeGenerated(unitBarcodes[0].barcode);
    }
  }, [unitBarcodes, onBarcodeGenerated]);

  if (!hasSerial || unitBarcodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <h4 className="font-medium">Unit Barcodes</h4>
      <div className="flex flex-col gap-4">
        {unitBarcodes.map((unit) => (
          <div key={unit.index} className="p-3 bg-background rounded border">
            <div className="text-sm font-medium mb-2">
              Serial: {unit.serial}
              {unit.batteryLevel !== undefined && (
                <span className="ml-2 text-muted-foreground">
                  Battery: {unit.batteryLevel}%
                </span>
              )}
              {unit.color && (
                <span className="ml-2 text-muted-foreground">
                  Color: {unit.color}
                </span>
              )}
            </div>
            <div className="flex justify-center mb-2">
              <BarcodeGenerator value={unit.barcode} />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {unit.barcode}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}