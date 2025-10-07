/**
 * Unified Inventory Label Component
 * Uses simple direct data fetching for reliable inventory label printing
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThermalLabelGenerator } from "./ThermalLabelGenerator";
import { useLabelDataProvider } from "./hooks/useLabelDataProvider";
import { Printer } from "lucide-react";
import type { Product } from "@/services/inventory/types";

interface UnifiedInventoryLabelsProps {
  products: Product[];
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
  
  // Simple validation - trust the label data provider
  const hasValidProducts = products && products.length > 0;
  
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

  // Simple error handling - trust the label data provider
  if (labelDataProvider.error) {
    return (
      <Button disabled variant="outline" className={buttonClassName}>
        <Printer className="h-4 w-4 mr-2" />
        Error Loading Labels
      </Button>
    );
  }

  // If no labels available, show disabled state with helpful message
  if (!labelDataProvider.labels || labelDataProvider.labels.length === 0) {
    const errorReason = hasValidProducts 
      ? `No printable labels found for ${products.length} product(s). Check console for details.`
      : 'No products selected';
    
    return (
      <Button 
        disabled 
        variant="outline" 
        className={buttonClassName}
        title={errorReason}
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