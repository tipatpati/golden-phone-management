/**
 * Unified Inventory Label Component
 * Uses direct database queries like supplier labels for reliable printing
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThermalLabelGenerator } from "./ThermalLabelGenerator";
import { useLabelDataProvider } from "./hooks/useLabelDataProvider";
import { Printer } from "lucide-react";

interface UnifiedInventoryLabelsProps {
  productIds: string[];
  companyName?: string;
  useMasterBarcode?: boolean;
  buttonText?: string;
  buttonClassName?: string;
}

export function UnifiedInventoryLabels({ 
  productIds,
  companyName = "GOLDEN PHONE SRL",
  useMasterBarcode = false,
  buttonText,
  buttonClassName = "w-full"
}: UnifiedInventoryLabelsProps) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  
  const labelDataProvider = useLabelDataProvider({
    source: 'inventory',
    productIds,
    useMasterBarcode
  });

  const handleOpenGenerator = () => {
    if (labelDataProvider.labels && labelDataProvider.labels.length > 0) {
      setIsGeneratorOpen(true);
    }
  };

  if (labelDataProvider.isLoading) {
    return (
      <Button disabled className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        Loading Labels...
      </Button>
    );
  }

  // Simple error handling - trust the label data provider
  if (labelDataProvider.error) {
    return (
      <Button disabled variant="outline" className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        Error Loading Labels
      </Button>
    );
  }

  if (!labelDataProvider.labels || labelDataProvider.labels.length === 0) {
    return (
      <Button 
        disabled 
        variant="outline" 
        className={buttonClassName}
        title="No printable labels available"
      >
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