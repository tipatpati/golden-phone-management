import React, { useState, useEffect } from "react";
import { BarcodeManagerProps } from "./types";
import { BarcodeGenerator } from "../BarcodeGenerator";
import { Code128GeneratorService } from "@/services/barcodes";
import { supabase } from "@/integrations/supabase/client";


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
    const fetchUnitBarcodes = async () => {
      if (!hasSerial) {
        setUnitBarcodes([]);
        return;
      }

      if (!productId) {
        // If no productId, generate preview barcodes for serial numbers input
        if (serialNumbers) {
          const serials = serialNumbers.split('\n').filter(s => s.trim());
          const previewBarcodes: SerialEntry[] = serials.map((serial, index) => ({
            serial: serial.trim(),
            barcode: `PREVIEW-${serial.trim()}-${index}`,
            barcodeFormat: 'CODE128',
            isValid: true,
            index
          }));
          setUnitBarcodes(previewBarcodes);
        } else {
          setUnitBarcodes([]);
        }
        return;
      }

      // Validate UUID to avoid PostgREST casting errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        console.warn('BarcodeManager: Provided productId is not a UUID; showing preview barcodes.');
        // Generate preview barcodes for serial numbers input
        if (serialNumbers) {
          const serials = serialNumbers.split('\n').filter(s => s.trim());
          const previewBarcodes: SerialEntry[] = serials.map((serial, index) => ({
            serial: serial.trim(),
            barcode: `PREVIEW-${serial.trim()}-${index}`,
            barcodeFormat: 'CODE128',
            isValid: true,
            index
          }));
          setUnitBarcodes(previewBarcodes);
        } else {
          setUnitBarcodes([]);
        }
        return;
      }

      try {
        const { data: units, error } = await supabase
          .from('product_units')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (units && units.length > 0) {
          // Show actual unit barcodes
          const mapped: SerialEntry[] = units.map((u: any, index: number) => {
            const validation = u.barcode
              ? Code128GeneratorService.validateCode128(u.barcode)
              : { isValid: false, format: 'CODE128', errors: [] };

            return {
              serial: u.serial_number,
              color: u.color || undefined,
              batteryLevel: u.battery_level ?? undefined,
              barcode: u.barcode || `PREVIEW-${u.serial_number}-${index}`,
              barcodeFormat: 'CODE128',
              isValid: !!u.barcode && validation.isValid,
              index
            };
          });
          setUnitBarcodes(mapped);
        } else {
          // If no units exist yet but we have serial numbers, show preview
          if (serialNumbers) {
            const serials = serialNumbers.split('\n').filter(s => s.trim());
            const previewBarcodes: SerialEntry[] = serials.map((serial, index) => ({
              serial: serial.trim(),
              barcode: `PREVIEW-${serial.trim()}-${index}`,
              barcodeFormat: 'CODE128',
              isValid: true,
              index
            }));
            setUnitBarcodes(previewBarcodes);
          } else {
            setUnitBarcodes([]);
          }
        }
      } catch (err) {
        console.error('BarcodeManager: failed to fetch unit barcodes:', err);
        setUnitBarcodes([]);
      }
    };

    fetchUnitBarcodes();
  }, [hasSerial, productId, serialNumbers]);

  // Notify parent ONLY for non-serial products (we do not auto-set product barcode from unit barcodes)
  const firstBarcode = unitBarcodes.length > 0 ? unitBarcodes[0].barcode : null;
  const prevBarcodeRef = React.useRef<string | null>(null);
  
  React.useEffect(() => {
    if (!firstBarcode || hasSerial || !onBarcodeGenerated) return; // guard: never propagate unit barcode to product when has serials
    if (firstBarcode !== prevBarcodeRef.current) {
      prevBarcodeRef.current = firstBarcode;
      onBarcodeGenerated(firstBarcode);
    }
  }, [firstBarcode, onBarcodeGenerated, hasSerial]);

  if (!hasSerial || unitBarcodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium">
          {productId && unitBarcodes.some(u => !u.barcode.startsWith('PREVIEW-')) 
            ? `Unit Barcodes (${unitBarcodes.length} units)` 
            : `Barcode Preview (${unitBarcodes.length} units)`
          }
        </h4>
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
                  {unit.barcode.startsWith('PREVIEW-') ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Preview
                    </span>
                  ) : (
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
            {productId && unitBarcodes.some(u => !u.barcode.startsWith('PREVIEW-')) ? (
              <>
                <li>Industry-standard CODE128 format with GPMS prefix</li>
                <li>Unique barcodes for each product unit</li>
                <li>Trackable through the barcode registry system</li>
                <li>Compatible with all modern barcode scanners</li>
              </>
            ) : (
              <>
                <li>Preview barcodes shown for form validation</li>
                <li>Actual CODE128 barcodes will be generated after saving</li>
                <li>Each unit will receive a unique barcode</li>
                <li>Use "Fix Missing Barcodes" if barcodes are missing after creation</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}