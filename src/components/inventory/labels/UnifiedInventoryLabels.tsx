/**
 * Unified Inventory Label Component
 * Uses direct database queries like supplier labels for reliable printing
 */

import React, { useState, useEffect } from "react";
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
  autoOpen?: boolean;
  onClose?: () => void;
}

export function UnifiedInventoryLabels({ 
  productIds,
  companyName = "GOLDEN PHONE SRL",
  useMasterBarcode = false,
  buttonText,
  buttonClassName = "w-full",
  autoOpen = false,
  onClose
}: UnifiedInventoryLabelsProps) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  
  const labelDataProvider = useLabelDataProvider({
    source: 'inventory',
    productIds,
    useMasterBarcode
  });

  // Auto-open when autoOpen prop is true and labels are loaded
  useEffect(() => {
    if (autoOpen && !labelDataProvider.isLoading && labelDataProvider.labels && labelDataProvider.labels.length > 0) {
      // Force refresh to get latest data
      labelDataProvider.refresh();
      setIsGeneratorOpen(true);
    }
  }, [autoOpen, labelDataProvider.isLoading, labelDataProvider.labels]);

  const handleOpenGenerator = () => {
    console.log('🔍 Opening label generator', {
      hasLabels: !!labelDataProvider.labels,
      labelCount: labelDataProvider.labels?.length,
      isLoading: labelDataProvider.isLoading,
      error: labelDataProvider.error
    });
    
    if (labelDataProvider.labels && labelDataProvider.labels.length > 0) {
      console.log('✅ Opening generator with labels:', labelDataProvider.labels);
      setIsGeneratorOpen(true);
    } else {
      console.log('❌ Cannot open generator - no labels available');
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
        onOpenChange={(open) => {
          setIsGeneratorOpen(open);
          if (!open && onClose) {
            onClose();
          }
        }}
        labelSource="inventory"
        dataProvider={labelDataProvider}
        companyName={companyName}
        isSupplierLabel={false}
        allowUnitSelection={true}
        productId={productIds[0]} // Pass the product ID to enable unit selection
      />
    </>
  );
}