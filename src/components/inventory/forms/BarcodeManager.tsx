import React, { useMemo, useState } from "react";
import { formatProductName } from "@/utils/productNaming";
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

  // Notify parent whenever barcode changes (but avoid infinite loops)
  const firstBarcode = unitBarcodes.length > 0 ? unitBarcodes[0].barcode : null;
  const prevBarcodeRef = React.useRef<string | null>(null);
  
  React.useEffect(() => {
    if (firstBarcode && firstBarcode !== prevBarcodeRef.current && onBarcodeGenerated) {
      prevBarcodeRef.current = firstBarcode;
      onBarcodeGenerated(firstBarcode);
    }
  }, [firstBarcode, onBarcodeGenerated]);

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
            <div key={unit.index} className="border rounded-lg p-4 space-y-3 bg-background">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Unit #{unit.index + 1}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    unit.isGS1Compliant ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {unit.barcodeFormat}
                  </span>
                  {unit.isGS1Compliant && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      GS1
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Serial:</strong> {unit.serial}</div>
                {unit.color && <div><strong>Color:</strong> {unit.color}</div>}
                {unit.batteryLevel && <div><strong>Battery:</strong> {unit.batteryLevel}%</div>}
              </div>
              
              <EnhancedBarcodeGenerator 
                value={unit.barcode}
                displayValue={true}
                format={barcodeFormat}
                showValidation={false}
              />
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Format Guide:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>EAN13:</strong> 13 digits, retail standard</li>
            <li><strong>CODE128:</strong> Alphanumeric, high density</li>
            <li><strong>GS1-128:</strong> GS1 compliant with application identifiers</li>
            <li><strong>AUTO:</strong> Best format selected automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}