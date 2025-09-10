/**
 * UNIVERSAL BARCODE MANAGER
 * Single component for barcode generation and label printing
 * Used consistently across supplier and inventory modules
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Barcode, Printer, RefreshCw, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { universalBarcodeService } from "@/services/shared/UniversalBarcodeService";
import type { UnitEntryForm } from "@/services/inventory/types";

interface UniversalBarcodeManagerProps {
  productId?: string;
  productBrand: string;
  productModel: string;
  units: UnitEntryForm[];
  source: 'inventory' | 'supplier';
  onBarcodeGenerated?: (serial: string, barcode: string) => void;
  onPrintCompleted?: (printedUnits: string[]) => void;
  showPrintButton?: boolean;
  className?: string;
}

interface UnitBarcodeStatus {
  serial: string;
  barcode?: string;
  hasBarcode: boolean;
  isGenerating: boolean;
  error?: string;
}

export function UniversalBarcodeManager({
  productId,
  productBrand,
  productModel,
  units,
  source,
  onBarcodeGenerated,
  onPrintCompleted,
  showPrintButton = true,
  className = ""
}: UniversalBarcodeManagerProps) {
  const [unitStatuses, setUnitStatuses] = useState<UnitBarcodeStatus[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Initialize unit statuses
  useEffect(() => {
    const statuses = units
      .filter(unit => unit.serial?.trim())
      .map(unit => ({
        serial: unit.serial,
        barcode: (unit as any).barcode, // May have barcode from previous generations
        hasBarcode: !!(unit as any).barcode,
        isGenerating: false
      }));
    
    setUnitStatuses(statuses);
  }, [units]);

  // Generate barcode for a single unit using ProductUnitCoordinator
  const generateBarcodeForUnit = async (serial: string) => {
    if (!productId) {
      toast.error('Product ID required for barcode generation');
      return;
    }

    setUnitStatuses(prev => prev.map(status => 
      status.serial === serial 
        ? { ...status, isGenerating: true, error: undefined }
        : status
    ));

    try {
      // Use ProductUnitCoordinator for unified barcode generation
      const { productUnitCoordinator } = await import('@/services/shared/ProductUnitCoordinator');
      
      const unit = units.find(u => u.serial === serial);
      if (!unit) {
        throw new Error('Unit not found');
      }

      console.log(`🎯 Generating barcode for unit: ${serial}`);
      
      const result = await productUnitCoordinator.generateBarcodesForUnits(
        productId,
        [{ 
          serial,
          battery_level: unit.battery_level,
          color: unit.color,
          storage: unit.storage,
          ram: unit.ram,
          price: unit.price,
          min_price: unit.min_price,
          max_price: unit.max_price
        }],
        source
      );

      if (result.success && result.barcodes.length > 0) {
        const barcode = result.barcodes[0].barcode;
        console.log(`✅ Generated barcode for ${serial}: ${barcode}`);
        
        setUnitStatuses(prev => prev.map(status =>
          status.serial === serial
            ? { ...status, barcode, hasBarcode: true, isGenerating: false }
            : status
        ));

        onBarcodeGenerated?.(serial, barcode);
        toast.success(`Barcode generated for ${serial}`);
      } else {
        const errorMsg = result.errors.join(', ') || 'Failed to generate barcode';
        console.error(`❌ Failed to generate barcode for ${serial}:`, errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Failed to generate barcode:', error);
      setUnitStatuses(prev => prev.map(status =>
        status.serial === serial
          ? { ...status, isGenerating: false, error: error.message }
          : status
      ));
      toast.error(`Failed to generate barcode for ${serial}`);
    }
  };

  // Generate barcodes for all units using ProductUnitCoordinator
  const generateAllBarcodes = async () => {
    if (!productId || units.length === 0) {
      toast.error('Product ID and units required for barcode generation');
      return;
    }

    setIsGeneratingAll(true);
    
    try {
      // Use ProductUnitCoordinator for unified barcode generation
      const { productUnitCoordinator } = await import('@/services/shared/ProductUnitCoordinator');
      
      const validUnits = units.filter(unit => unit.serial?.trim()).map(unit => ({
        serial: unit.serial,
        battery_level: unit.battery_level,
        color: unit.color,
        storage: unit.storage,
        ram: unit.ram,
        price: unit.price,
        min_price: unit.min_price,
        max_price: unit.max_price
      }));
      
      const result = await productUnitCoordinator.generateBarcodesForUnits(
        productId,
        validUnits,
        source
      );

      if (result.success) {
        // Update all unit statuses with new barcodes
        setUnitStatuses(prev => prev.map(status => {
          const generatedBarcode = result.barcodes.find(b => b.serial === status.serial);
          if (generatedBarcode) {
            onBarcodeGenerated?.(status.serial, generatedBarcode.barcode);
            return {
              ...status,
              barcode: generatedBarcode.barcode,
              hasBarcode: true,
              isGenerating: false
            };
          }
          return status;
        }));

        toast.success(`Generated barcodes for ${result.barcodes.length} units`);
      } else {
        throw new Error(result.errors.join(', ') || 'Failed to generate barcodes');
      }
    } catch (error) {
      console.error('Failed to generate all barcodes:', error);
      toast.error('Failed to generate barcodes');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Print thermal labels using ProductUnitCoordinator
  const printLabels = async () => {
    const unitsWithBarcodes = unitStatuses.filter(status => status.hasBarcode && status.barcode);
    
    if (unitsWithBarcodes.length === 0) {
      toast.error('No barcodes available for printing');
      return;
    }

    if (!productId) {
      toast.error('Product ID required for thermal label printing');
      return;
    }

    setIsPrinting(true);

    try {
      // Use ProductUnitCoordinator for professional thermal label printing
      const { productUnitCoordinator } = await import('@/services/shared/ProductUnitCoordinator');

      const unitsForPrinting = unitsWithBarcodes.map(status => {
        const unit = units.find(u => u.serial === status.serial);
        return {
          serial: status.serial,
          barcode: status.barcode!,
          color: unit?.color,
          storage: unit?.storage,
          ram: unit?.ram,
          price: unit?.price,
          min_price: unit?.min_price,
          max_price: unit?.max_price
        };
      });

      const result = await productUnitCoordinator.printLabelsForUnits(
        productId,
        productBrand,
        productModel,
        unitsForPrinting,
        {
          source,
          metadata: {
            printedAt: new Date().toISOString(),
            userInitiated: true
          }
        }
      );

      if (result.success) {
        toast.success(`🎯 Printed ${result.totalLabels} professional thermal labels`);
        onPrintCompleted?.(result.printedUnits);
      } else {
        throw new Error(result.errors.join(', ') || 'Failed to print thermal labels');
      }
    } catch (error) {
      console.error('Failed to print thermal labels:', error);
      toast.error('Failed to print thermal labels');
    } finally {
      setIsPrinting(false);
    }
  };

  // Generate barcodes and print thermal labels in one professional operation
  const generateAndPrint = async () => {
    if (!productId || units.length === 0) {
      toast.error('Product ID and units required');
      return;
    }

    setIsGeneratingAll(true);
    setIsPrinting(true);

    try {
      // Step 1: Generate barcodes using ProductUnitCoordinator
      const { productUnitCoordinator } = await import('@/services/shared/ProductUnitCoordinator');
      
      const validUnits = units.filter(unit => unit.serial?.trim()).map(unit => ({
        serial: unit.serial,
        battery_level: unit.battery_level,
        color: unit.color,
        storage: unit.storage,
        ram: unit.ram,
        price: unit.price,
        min_price: unit.min_price,
        max_price: unit.max_price
      }));
      
      const barcodeResult = await productUnitCoordinator.generateBarcodesForUnits(
        productId,
        validUnits,
        source
      );

      if (!barcodeResult.success) {
        throw new Error(barcodeResult.errors.join(', ') || 'Failed to generate barcodes');
      }

      // Update unit statuses with generated barcodes
      setUnitStatuses(prev => prev.map(status => {
        const generatedBarcode = barcodeResult.barcodes.find(b => b.serial === status.serial);
        if (generatedBarcode) {
          onBarcodeGenerated?.(status.serial, generatedBarcode.barcode);
          return {
            ...status,
            barcode: generatedBarcode.barcode,
            hasBarcode: true,
            isGenerating: false
          };
        }
        return status;
      }));

      // Step 2: Print thermal labels using the professional system
      const unitsForPrinting = barcodeResult.barcodes.map(bc => {
        const unit = validUnits.find(u => u.serial === bc.serial);
        return {
          serial: bc.serial,
          barcode: bc.barcode,
          color: unit?.color,
          storage: unit?.storage,
          ram: unit?.ram,
          price: unit?.price,
          min_price: unit?.min_price,
          max_price: unit?.max_price
        };
      });

      const printResult = await productUnitCoordinator.printLabelsForUnits(
        productId,
        productBrand,
        productModel,
        unitsForPrinting,
        {
          source,
          metadata: {
            userInitiated: true,
            timestamp: new Date().toISOString()
          }
        }
      );

      if (printResult.success) {
        toast.success(`🎯 Generated barcodes and printed ${printResult.totalLabels} professional thermal labels`);
        onPrintCompleted?.(printResult.printedUnits);
      } else {
        throw new Error(printResult.errors.join(', ') || 'Failed to print thermal labels');
      }

    } catch (error) {
      console.error('Failed to generate and print thermal labels:', error);
      toast.error('Failed to generate and print thermal labels');
    } finally {
      setIsGeneratingAll(false);
      setIsPrinting(false);
    }
  };

  const validUnitsCount = units.filter(u => u.serial?.trim()).length;
  const unitsWithBarcodes = unitStatuses.filter(s => s.hasBarcode).length;

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Barcode className="h-4 w-4" />
          Universal Barcode Manager
          <Badge variant="outline" className="ml-auto">
            {source}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">{unitsWithBarcodes}/{validUnitsCount}</span> units have barcodes
          </div>
          <div className="text-xs text-muted-foreground">
            Product: {productBrand} {productModel}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateAllBarcodes}
            disabled={isGeneratingAll || validUnitsCount === 0}
            className="flex-1"
          >
            {isGeneratingAll ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Barcode className="h-3 w-3 mr-1" />
            )}
            Generate All
          </Button>

          {showPrintButton && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={printLabels}
                disabled={isPrinting || unitsWithBarcodes === 0}
                className="flex-1"
              >
                {isPrinting ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Printer className="h-3 w-3 mr-1" />
                )}
                Print ({unitsWithBarcodes})
              </Button>

              <Button
                size="sm"
                onClick={generateAndPrint}
                disabled={isGeneratingAll || isPrinting || validUnitsCount === 0}
                className="flex-1"
              >
                {(isGeneratingAll || isPrinting) ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Printer className="h-3 w-3 mr-1" />
                )}
                Generate & Print
              </Button>
            </>
          )}
        </div>

        {/* Unit Status List */}
        {unitStatuses.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {unitStatuses.map((status) => (
              <div
                key={status.serial}
                className="flex items-center justify-between p-2 bg-muted/20 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">{status.serial}</span>
                  {status.hasBarcode ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : status.error ? (
                    <AlertCircle className="h-3 w-3 text-red-600" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {!status.hasBarcode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateBarcodeForUnit(status.serial)}
                      disabled={status.isGenerating || !productId}
                      className="h-6 px-2 text-xs"
                    >
                      {status.isGenerating ? (
                        <RefreshCw className="h-2 w-2 animate-spin" />
                      ) : (
                        <Barcode className="h-2 w-2" />
                      )}
                    </Button>
                  )}
                  
                  {status.hasBarcode && (
                    <Badge variant="outline" className="h-5 text-xs">
                      Ready
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {validUnitsCount === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            No units with serial numbers found
          </div>
        )}
      </CardContent>
    </Card>
  );
}