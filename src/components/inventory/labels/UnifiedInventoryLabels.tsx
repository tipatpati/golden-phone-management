/**
 * Unified Inventory Label Component
 * Uses the unified label system for consistent inventory label printing
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
  
  const labelProvider = useLabelDataProvider({
    source: 'inventory',
    products,
    useMasterBarcode
  });

  const handleOpenGenerator = async () => {
    setIsGeneratorOpen(true);
    
    // Show success toast when labels are available
    if (labelProvider.labels.length > 0) {
      const { showErrorToast } = await import('@/components/ui/error-toast');
      showErrorToast({
        title: 'Print labels ready',
        description: `${labelProvider.labels.length} thermal labels prepared`,
        type: 'success',
        duration: 2000
      });
    }
  };

  if (labelProvider.isLoading) {
    return (
      <Button disabled className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        Loading Labels...
      </Button>
    );
  }

  if (labelProvider.error) {
    return (
      <Button 
        onClick={labelProvider.refresh} 
        variant="outline" 
        className={buttonClassName}
      >
        <Printer className="h-4 w-4 mr-2" />
        Retry Print Labels
      </Button>
    );
  }

  if (labelProvider.labels.length === 0) {
    return (
      <Button disabled variant="outline" className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        No Labels Available
      </Button>
    );
  }

  const defaultButtonText = `Print ${labelProvider.labels.length} Thermal Labels`;

  return (
    <>
      <Button onClick={handleOpenGenerator} className={buttonClassName}>
        <Printer className={`h-4 w-4 ${buttonText !== undefined ? 'mr-2' : ''}`} />
        {buttonText !== undefined ? buttonText : defaultButtonText}
      </Button>

      <ThermalLabelGenerator
        open={isGeneratorOpen}
        onOpenChange={setIsGeneratorOpen}
        labelSource="inventory"
        dataProvider={labelProvider}
        companyName={companyName}
        isSupplierLabel={false}
        allowUnitSelection={true}
      />
    </>
  );
}