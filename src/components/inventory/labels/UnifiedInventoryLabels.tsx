/**
 * Unified Inventory Label Component
 * Uses simple direct data fetching for reliable inventory label printing
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThermalLabelGenerator } from "./ThermalLabelGenerator";
import { useLabelDataProvider } from "./hooks/useLabelDataProvider";
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
  
  // Validate that we have products with actual data
  const hasValidProducts = products && products.length > 0;
  const hasAvailableUnits = hasValidProducts && products.some(p => 
    p.units && p.units.length > 0 && p.units.some(u => u.status !== 'sold')
  );
  
  const labelDataProvider = useLabelDataProvider({
    source: 'inventory',
    products: hasValidProducts ? products : [],
    useMasterBarcode
  });

  const handleOpenGenerator = () => {
    // Only open if we have labels available
    if (labelDataProvider.labels && labelDataProvider.labels.length > 0) {
      setIsGeneratorOpen(true);
    }
  };

  // Show loading state while data is being processed
  if (!hasValidProducts || labelDataProvider.isLoading) {
    return (
      <Button disabled className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        Loading Labels...
      </Button>
    );
  }

  // Show error or no data state
  if (labelDataProvider.error || !hasAvailableUnits || !labelDataProvider.labels || labelDataProvider.labels.length === 0) {
    const errorMessage = labelDataProvider.error 
      ? "Error Loading Labels" 
      : !hasAvailableUnits 
        ? "No Available Units" 
        : "No Labels Available";
        
    return (
      <Button disabled variant="outline" className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        {errorMessage}
      </Button>
    );
  }

  const defaultButtonText = `Print ${labelDataProvider.labels.length} Thermal Labels`;

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
        dataProvider={labelDataProvider}
        companyName={companyName}
        isSupplierLabel={false}
        allowUnitSelection={true}
      />
    </>
  );
}