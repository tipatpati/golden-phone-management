/**
 * Unified Unit Barcode Manager Component
 * Handles barcode display, generation, and printing for product units
 * Used by both inventory and supplier modules
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Barcode, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useBarcodeService } from "@/components/shared/useBarcodeService";
import { Services } from "@/services/core";
import type { UnitEntryForm } from "@/services/inventory/types";

interface UnitBarcodeInfo {
  serial: string;
  barcode?: string;
  unitId?: string;
  isValid: boolean;
}

interface UnitBarcodeManagerProps {
  units: UnitEntryForm[];
  productId?: string;
  existingUnitBarcodes?: Record<string, string>; // serial -> barcode
  onBarcodeGenerated?: (serial: string, barcode: string) => void;
  onPrintRequested?: (barcodes: Array<{ serial: string; barcode: string }>) => void;
  showPrintButton?: boolean;
  className?: string;
}

export function UnitBarcodeManager({
  units,
  productId,
  existingUnitBarcodes = {},
  onBarcodeGenerated,
  onPrintRequested,
  showPrintButton = true,
  className = ""
}: UnitBarcodeManagerProps) {
  const { service: barcodeService, isReady } = useBarcodeService();
  const [unitBarcodes, setUnitBarcodes] = useState<UnitBarcodeInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Initialize barcode info from units and existing barcodes
  useEffect(() => {
    const barcodeInfo: UnitBarcodeInfo[] = units
      .filter(unit => unit.serial?.trim())
      .map(unit => {
        const existingBarcode = existingUnitBarcodes[unit.serial!];
        return {
          serial: unit.serial!,
          barcode: existingBarcode,
          isValid: !!existingBarcode
        };
      });

    setUnitBarcodes(barcodeInfo);
  }, [units, existingUnitBarcodes]);

  const generateBarcode = async (serial: string, unitId?: string) => {
    if (!barcodeService || !isReady) {
      toast.error('Barcode service not available');
      return;
    }

    try {
      setIsGenerating(true);
      
      let barcode: string;
      if (unitId) {
        // Generate for existing unit
        barcode = await barcodeService.generateUnitBarcode(unitId);
      } else {
        // Generate temporary barcode for new unit
        const tempId = crypto.randomUUID();
        barcode = await barcodeService.generateUnitBarcode(tempId, {
          metadata: { serial, temp: true }
        });
      }

      // Update local state
      setUnitBarcodes(prev => prev.map(info => 
        info.serial === serial 
          ? { ...info, barcode, isValid: true }
          : info
      ));

      // Notify parent component
      onBarcodeGenerated?.(serial, barcode);
      
      toast.success(`Barcode generated for ${serial}`);
    } catch (error) {
      console.error('Failed to generate barcode:', error);
      toast.error(`Failed to generate barcode for ${serial}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const printBarcodes = async () => {
    const validBarcodes = unitBarcodes
      .filter(info => info.barcode && info.isValid)
      .map(info => ({ serial: info.serial, barcode: info.barcode! }));

    if (validBarcodes.length === 0) {
      toast.error('No valid barcodes to print');
      return;
    }

    try {
      setIsPrinting(true);

      if (onPrintRequested) {
        // Use custom print handler
        onPrintRequested(validBarcodes);
      } else {
        // PHASE 2: Use unified ThermalLabelGenerator instead of basic print service
        const { ThermalLabelDataService } = await import("@/services/labels/ThermalLabelDataService");
        
        // Get product information if available
        let productInfo = null;
        if (productId) {
          try {
            const { ProductUnitManagementService } = await import("@/services/shared/ProductUnitManagementService");
            const product = await ProductUnitManagementService.getProductById(productId);
            productInfo = product;
          } catch (error) {
            console.warn('Could not fetch product info for enhanced printing:', error);
          }
        }
        
        // Create thermal label data using the unified service
        const thermalLabels = await Promise.all(validBarcodes.map(async ({ serial, barcode }) => {
          // Find the corresponding unit for enhanced label data
          const unit = units.find(u => u.serial === serial);
          
          return {
            id: crypto.randomUUID(),
            productName: productInfo ? `${productInfo.brand} ${productInfo.model}` : serial,
            brand: productInfo?.brand || '',
            model: productInfo?.model || '',
            barcode,
            price: unit?.price || productInfo?.price || 0,
            serial,
            color: unit?.color,
            storage: unit?.storage || productInfo?.storage,
            ram: unit?.ram || productInfo?.ram,
            batteryLevel: unit?.battery_level,
            category: productInfo?.category?.name
          };
        }));

        // Use the same print service as inventory module (unified service)
        const printService = await Services.getPrintService();
        const result = await printService.printLabels(thermalLabels, {
          companyName: "GOLDEN PHONE SRL",
          showPrice: true,
          showSerial: true,
          labelSize: "6x5cm"
        });

        // PHASE 4: Update shared print history
        if (result.success) {
          console.log(`📄 UNIFIED PRINT: Successfully printed ${result.totalLabels} thermal labels from UnitBarcodeManager`);
          toast.success(`Printed ${result.totalLabels} thermal labels`);
        } else {
          toast.error(`Print failed: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Failed to print barcodes:', error);
      toast.error('Failed to print barcodes');
    } finally {
      setIsPrinting(false);
    }
  };

  const generateAllBarcodes = async () => {
    const unitsWithoutBarcodes = unitBarcodes.filter(info => !info.barcode);
    
    for (const info of unitsWithoutBarcodes) {
      await generateBarcode(info.serial, info.unitId);
    }
  };

  if (unitBarcodes.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Unit Barcodes
          </CardTitle>
          <div className="flex gap-2">
            {unitBarcodes.some(info => !info.barcode) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateAllBarcodes}
                disabled={isGenerating || !isReady}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                Generate All
              </Button>
            )}
            {showPrintButton && unitBarcodes.some(info => info.barcode) && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={printBarcodes}
                disabled={isPrinting}
              >
                <Printer className={`h-4 w-4 mr-1 ${isPrinting ? 'animate-pulse' : ''}`} />
                Print Labels
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {unitBarcodes.map((info, index) => (
          <div key={info.serial} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm">{info.serial}</span>
              {info.barcode ? (
                <Badge variant="secondary" className="font-mono text-xs">
                  {info.barcode}
                </Badge>
              ) : (
                <Badge variant="outline">No barcode</Badge>
              )}
            </div>
            {!info.barcode && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateBarcode(info.serial, info.unitId)}
                disabled={isGenerating || !isReady}
              >
                <Barcode className="h-3 w-3 mr-1" />
                Generate
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}