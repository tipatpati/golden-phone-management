import React, { useState, useEffect } from "react";
import type { BarcodeManagerProps } from "@/services/inventory/types";
import { BarcodeGenerator } from "../BarcodeGenerator";
import { UnitBarcodeManager } from "@/components/shared/forms/UnitBarcodeManager";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
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

/**
 * @deprecated Use UnitBarcodeManager from shared/forms instead
 * This component is kept for backward compatibility only
 */
export function BarcodeManager({
  serialNumbers,
  hasSerial,
  productId,
  onBarcodeGenerated
}: BarcodeManagerProps) {
  
  const [units, setUnits] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchUnits = async () => {
      if (!hasSerial || !productId) {
        setUnits([]);
        return;
      }

      try {
        const productUnits = await ProductUnitManagementService.getUnitsForProduct(productId);
        // Convert to format expected by UnitBarcodeManager
        const unitEntries = productUnits.map(unit => ({
          serial: unit.serial_number,
          battery_level: unit.battery_level,
          color: unit.color,
          storage: unit.storage,
          ram: unit.ram,
          price: unit.price,
          min_price: unit.min_price,
          max_price: unit.max_price
        }));
        setUnits(unitEntries);
      } catch (error) {
        console.error('Failed to fetch units:', error);
        setUnits([]);
      }
    };

    fetchUnits();
  }, [hasSerial, productId, serialNumbers]);

  if (!hasSerial) {
    return null;
  }

  // Use the unified barcode manager for consistency
  return (
    <UnitBarcodeManager
      units={units}
      productId={productId}
      onBarcodeGenerated={onBarcodeGenerated}
      showPrintButton={true}
    />
  );
}