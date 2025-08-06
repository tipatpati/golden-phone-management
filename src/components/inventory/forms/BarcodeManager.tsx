import React, { useMemo, useState } from "react";
import { BarcodeManagerProps } from "./types";
import { EnhancedBarcodeGenerator } from "../EnhancedBarcodeGenerator";
import { BarcodeFormatSelector, BarcodeFormat } from "../BarcodeFormatSelector";
import { generateIMEIBarcode, BarcodeOptions } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";

interface SerialEntry {
  serial: string;
  color?: string;
  batteryLevel?: number;
  barcode: string;
  barcodeFormat: string;
  isGS1Compliant: boolean;
  index: number;
}

export function BarcodeManager({
  serialNumbers,
  hasSerial,
  productId,
  onBarcodeGenerated
}: BarcodeManagerProps) {
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('AUTO');

  // Generate enhanced barcodes for each serial number
  const unitBarcodes = useMemo<SerialEntry[]>(() => {
    if (!hasSerial || !serialNumbers.trim()) return [];
    
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
      const parsed = parseSerialWithBattery(line);
      
      const options: BarcodeOptions = {
        format: barcodeFormat as any,
        productId,
        batteryLevel: parsed.batteryLevel
      };
      
      const result = generateIMEIBarcode(parsed.serial, options);
      
      return {
        serial: line.trim(),
        color: parsed.color,
        batteryLevel: parsed.batteryLevel,
        barcode: result.barcode,
        barcodeFormat: result.format,
        isGS1Compliant: result.isGS1Compliant,
        index: index
      };
    });
  }, [serialNumbers, productId, hasSerial, barcodeFormat]);

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
    <div className="space-y-6">
      <BarcodeFormatSelector 
        value={barcodeFormat}
        onChange={setBarcodeFormat}
      />
      
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium">Unit Barcodes ({unitBarcodes.length} units)</h4>
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
                <EnhancedBarcodeGenerator 
                  value={unit.serial}
                  displayValue={true}
                  format={barcodeFormat}
                  showValidation={true}
                  barcodeOptions={{
                    format: barcodeFormat as any,
                    productId,
                    batteryLevel: unit.batteryLevel
                  }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground font-mono">
                {unit.barcode}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}