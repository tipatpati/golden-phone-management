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
  
  const labelDataProvider = useLabelDataProvider({
    source: 'inventory',
    products,
    useMasterBarcode
  });

  const handleOpenGenerator = () => {
    setIsGeneratorOpen(true);
  };

  if (labelDataProvider.isLoading) {
    return (
      <Button disabled className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        Loading Labels...
      </Button>
    );
  }

  if (labelDataProvider.error || !labelDataProvider.labels || labelDataProvider.labels.length === 0) {
    return (
      <Button disabled variant="outline" className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        No Labels Available
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