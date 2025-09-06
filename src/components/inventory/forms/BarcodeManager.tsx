import React, { useMemo, useState, useEffect } from "react";
import { formatProductName } from "@/utils/productNaming";
import { BarcodeManagerProps } from "./types";
import { BarcodeGenerator } from "../BarcodeGenerator";
import { Code128GeneratorService } from "@/services/barcodes";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";


interface SerialEntry {
  serial: string;
  color?: string;
  batteryLevel?: number;
  barcode: string;
  barcodeFormat: string;
  isValid: boolean;
  index: number;
}

export function BarcodeManager({
  serialNumbers,
  hasSerial,
  productId,
  onBarcodeGenerated
}: BarcodeManagerProps) {

  // Generate professional CODE128 barcodes for each serial number
  const [unitBarcodes, setUnitBarcodes] = useState<SerialEntry[]>([]);
  
  useEffect(() => {
    const generateBarcodes = async () => {
      if (!hasSerial || !serialNumbers.trim()) {
        setUnitBarcodes([]);
        return;
      }
      
      const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
      const barcodes: SerialEntry[] = [];
      
      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const parsed = parseSerialWithBattery(line);
        
        // Generate temporary unit ID for barcode generation
        const tempUnitId = `temp-${productId}-${index}-${Date.now()}`;
        
        try {
          // Use professional CODE128 service for barcode generation
          const barcode = await Code128GeneratorService.generateUnitBarcode(tempUnitId, {
            metadata: {
              serial: parsed.serial,
              color: parsed.color,
              battery_level: parsed.batteryLevel,
              product_id: productId
            }
          });
          
          const validation = Code128GeneratorService.validateCode128(barcode);
          
          barcodes.push({
            serial: parsed.serial,
            color: parsed.color,
            batteryLevel: parsed.batteryLevel,
            barcode: barcode,
            barcodeFormat: 'CODE128',
            isValid: validation.isValid,
            index: index
          });
        } catch (error) {
          console.error(`Failed to generate barcode for ${parsed.serial}:`, error);
          // Fallback barcode
          const fallbackBarcode = `GPMSU${tempUnitId.slice(-6)}`;
          barcodes.push({
            serial: parsed.serial,
            color: parsed.color,
            batteryLevel: parsed.batteryLevel,
            barcode: fallbackBarcode,
            barcodeFormat: 'CODE128',
            isValid: false,
            index: index
          });
        }
      }
      
      setUnitBarcodes(barcodes);
    };
    
    generateBarcodes();
  }, [serialNumbers, productId, hasSerial]);

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
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium">Unit Barcodes ({unitBarcodes.length} units)</h4>
        <div className="flex flex-col gap-4">
          {unitBarcodes.map((unit) => (
            <div key={unit.index} className="border rounded-lg p-4 space-y-3 bg-background">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Unit #{unit.index + 1}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded ${
                    unit.isValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {unit.barcodeFormat}
                  </span>
                  {unit.isValid && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      Valid
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Serial:</strong> {unit.serial}</div>
                {unit.color && <div><strong>Color:</strong> {unit.color}</div>}
                {unit.batteryLevel && <div><strong>Battery:</strong> {unit.batteryLevel}%</div>}
              </div>
              
              <BarcodeGenerator 
                value={unit.barcode}
                displayValue={true}
                format="CODE128"
              />
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Professional CODE128 Barcodes:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Industry-standard CODE128 format with GPMS prefix</li>
            <li>Unique barcodes for each product unit</li>
            <li>Trackable through the barcode registry system</li>
            <li>Compatible with all modern barcode scanners</li>
          </ul>
        </div>
      </div>
    </div>
  );
}