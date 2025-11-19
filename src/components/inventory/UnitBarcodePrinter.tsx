/**
 * UNIT BARCODE PRINTER COMPONENT
 * Extracted from InventoryTable to fix React Fragment error
 * Handles printing barcodes for individual product units
 */

import { UnitBarcodeManager } from '@/components/shared/forms/UnitBarcodeManager';

interface UnitBarcodePrinterProps {
  unitId: string;
  productList: any[];
  onClose: () => void;
}

export function UnitBarcodePrinter({ unitId, productList, onClose }: UnitBarcodePrinterProps) {
  // Find the unit to print
  const unitToPrint = productList
    .flatMap(p => p.units || [])
    .find((u: any) => u.id === unitId);
  
  if (!unitToPrint) return null;

  return (
    <UnitBarcodeManager
      units={[{
        serial: unitToPrint.serial_number,
        color: unitToPrint.color,
        storage: unitToPrint.storage,
        ram: unitToPrint.ram,
        battery_level: unitToPrint.battery_level,
        price: unitToPrint.price
      }]}
      productId={unitToPrint.product_id}
      existingUnitBarcodes={{ [unitToPrint.serial_number]: unitToPrint.barcode }}
      showPrintButton={false}
      onPrintRequested={(barcodes) => {
        // Auto-trigger print after component mounts
        setTimeout(() => onClose(), 1000);
      }}
    />
  );
}
