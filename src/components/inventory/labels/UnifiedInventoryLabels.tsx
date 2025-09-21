/**
 * Unified Inventory Label Component
 * Uses simple direct data fetching for reliable inventory label printing
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThermalLabelGenerator } from "./ThermalLabelGenerator";
import { useSimpleInventoryLabels } from "./hooks/useSimpleInventoryLabels";
import { Printer } from "lucide-react";

interface UnifiedInventoryLabelsProps {
  products: any[];
  companyName?: string;
  useMasterBarcode?: boolean;
  buttonText?: string;
  buttonClassName?: string;
}

export function UnifiedInventoryLabels({ 
  products,
  companyName = "GOLDEN PHONE SRL",
  useMasterBarcode = false,
  buttonText,
  buttonClassName = "w-full"
}: UnifiedInventoryLabelsProps) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  
  // Extract product IDs for the query
  const productIds = products.map(p => p.id).filter(Boolean);
  
  const labelsQuery = useSimpleInventoryLabels(productIds);

  const handleOpenGenerator = () => {
    setIsGeneratorOpen(true);
  };

  if (labelsQuery.isLoading) {
    return (
      <Button disabled className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        Loading Labels...
      </Button>
    );
  }

  if (labelsQuery.error || !labelsQuery.data || labelsQuery.data.length === 0) {
    return (
      <Button disabled variant="outline" className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        No Labels Available
      </Button>
    );
  }

  // Convert to ThermalLabelData format
  const thermalLabels = labelsQuery.data.map(label => ({
    id: label.id,
    productName: label.productName,
    brand: label.brand,
    model: label.model,
    serialNumber: label.serial,
    barcode: label.barcode,
    price: label.price,
    maxPrice: label.maxPrice,
    minPrice: undefined,
    category: undefined,
    color: label.color,
    batteryLevel: label.batteryLevel,
    storage: label.storage,
    ram: label.ram
  }));

  const defaultButtonText = `Print ${thermalLabels.length} Thermal Labels`;

  return (
    <>
      <Button onClick={handleOpenGenerator} className={buttonClassName}>
        <Printer className={`h-4 w-4 ${buttonText !== undefined && buttonText !== "" ? "mr-2" : ""}`} />
        {buttonText !== undefined ? buttonText : defaultButtonText}
      </Button>

      <ThermalLabelGenerator
        open={isGeneratorOpen}
        onOpenChange={setIsGeneratorOpen}
        labelSource="inventory"
        labels={thermalLabels}
        companyName={companyName}
        isSupplierLabel={false}
        allowUnitSelection={true}
      />
    </>
  );
}