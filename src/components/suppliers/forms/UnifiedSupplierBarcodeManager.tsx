/**
 * UNIFIED SUPPLIER BARCODE MANAGER
 * Replaces obsolete manual barcode input with UniversalBarcodeService integration
 * Provides immediate barcode generation when units are added to supplier transactions
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UniversalBarcodeManager } from "@/components/shared/UniversalBarcodeManager";
import { Barcode, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { UnitEntryForm } from "@/services/inventory/types";

interface UnifiedSupplierBarcodeManagerProps {
  productId?: string;
  productBrand: string;
  productModel: string;
  units: UnitEntryForm[];
  onBarcodeGenerated?: (serial: string, barcode: string) => void;
  onPrintCompleted?: (printedUnits: string[]) => void;
  className?: string;
}

export function UnifiedSupplierBarcodeManager({
  productId,
  productBrand,
  productModel,
  units,
  onBarcodeGenerated,
  onPrintCompleted,
  className = ""
}: UnifiedSupplierBarcodeManagerProps) {
  const [generatedBarcodes, setGeneratedBarcodes] = useState<Record<string, string>>({});

  const validUnits = units.filter(unit => unit.serial?.trim());
  const unitsWithBarcodes = validUnits.filter(unit => 
    generatedBarcodes[unit.serial] || (unit as any).barcode
  );

  const handleBarcodeGenerated = (serial: string, barcode: string) => {
    setGeneratedBarcodes(prev => ({ ...prev, [serial]: barcode }));
    onBarcodeGenerated?.(serial, barcode);
  };

  const handlePrintCompleted = (printedUnits: string[]) => {
    toast.success(`Successfully printed labels for ${printedUnits.length} units`);
    onPrintCompleted?.(printedUnits);
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          Supplier Unit Management
          <Badge variant="secondary" className="ml-auto">
            Unified System
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">{unitsWithBarcodes.length}/{validUnits.length}</span> units ready for printing
          </div>
          <div className="text-xs text-muted-foreground">
            {productBrand} {productModel}
          </div>
        </div>

        {/* Professional Universal Barcode Manager */}
        {productId ? (
          <UniversalBarcodeManager
            productId={productId}
            productBrand={productBrand}
            productModel={productModel}
            units={units}
            source="supplier"
            onBarcodeGenerated={handleBarcodeGenerated}
            onPrintCompleted={handlePrintCompleted}
            showPrintButton={true}
          />
        ) : (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              Product must be saved before barcode generation is available
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg">
          <div className="font-medium mb-1">How it works:</div>
          <ul className="space-y-1 text-xs">
            <li>• Barcodes are automatically generated using the Universal Barcode Service</li>
            <li>• Each unit gets a unique barcode when the transaction is completed</li>
            <li>• Professional thermal labels can be printed immediately</li>
            <li>• All barcode operations are logged for audit purposes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}