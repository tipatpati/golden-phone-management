import React, { useState, useEffect } from "react";
import type { BarcodeManagerProps } from "@/services/inventory/types";
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
        // For new products, don't show any preview barcodes - they'll be generated on save
        setUnitBarcodes([]);
        return;
      }

      // Validate UUID to avoid PostgREST casting errors
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(productId)) {
        console.warn('BarcodeManager: Provided productId is not a valid UUID');
        setUnitBarcodes([]);
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
          // ONLY show actual unit barcodes from database - single source of truth
          const mapped: SerialEntry[] = units.map((u: any, index: number) => {
            const validation = u.barcode
              ? Code128GeneratorService.validateCode128(u.barcode)
              : { isValid: false, format: 'CODE128', errors: [] };

            return {
              serial: u.serial_number,
              color: u.color || undefined,
              batteryLevel: u.battery_level ?? undefined,
              barcode: u.barcode || 'NO_BARCODE',
              barcodeFormat: 'CODE128',
              isValid: !!u.barcode && validation.isValid,
              index
            };
          });
          setUnitBarcodes(mapped);
        } else {
          // No units exist yet - don't show any barcodes
          setUnitBarcodes([]);
        }
      } catch (err) {
        console.error('BarcodeManager: failed to fetch unit barcodes:', err);
        setUnitBarcodes([]);
      }
    };

    fetchUnitBarcodes();
  }, [hasSerial, productId, serialNumbers]);

  // Don't auto-generate barcodes - they're only created through the product units system

  if (!hasSerial) {
    return null;
  }

  // For new products without productId, show info message
  if (!productId) {
    return (
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Barcode Generation</h4>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>✨ Barcodes will be automatically generated when you save this product.</p>
          <p>Each unit will receive a unique CODE128 barcode with GPMS prefix.</p>
        </div>
      </div>
    );
  }

  // For existing products, show actual barcodes or message if none exist
  if (unitBarcodes.length === 0) {
    return (
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Unit Barcodes</h4>
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>No units found for this product yet.</p>
          <p>Add units to see their barcodes here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">
            Unit Barcodes ({unitBarcodes.length} units)
          </h4>
          {productId && (
            <div className="text-xs text-muted-foreground">
              Use inventory admin tools to update barcodes
            </div>
          )}
        </div>
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
                  {unit.barcode === 'NO_BARCODE' ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                      Missing
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
              
              {unit.barcode !== 'NO_BARCODE' ? (
                <BarcodeGenerator 
                  value={unit.barcode}
                  displayValue={true}
                  format="CODE128"
                />
              ) : (
                <div className="text-center py-4 text-red-500 text-sm">
                  No barcode - use "Fix Missing Barcodes" to generate
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Single Source Barcode System:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Barcodes are generated only when product units are created</li>
            <li>All barcodes use industry-standard CODE128 format with GPMS prefix</li>
            <li>Each unit receives a unique barcode tracked in the registry</li>
            <li>Use "Fix Missing Barcodes" tool if any units are missing barcodes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}