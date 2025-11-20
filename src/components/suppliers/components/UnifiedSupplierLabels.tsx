/**
 * Unified Supplier Label Component
 * Uses the inventory ThermalLabelGenerator with supplier-specific configuration
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThermalLabelGenerator } from "@/components/inventory/labels/ThermalLabelGenerator";
import { useLabelDataProvider } from "@/components/inventory/labels/hooks/useLabelDataProvider";
import { Printer } from "lucide-react";

interface UnifiedSupplierLabelsProps {
  transactionIds: string[];
  companyName?: string;
}

export function UnifiedSupplierLabels({ 
  transactionIds, 
  companyName = "GOLDEN PHONE SRL" 
}: UnifiedSupplierLabelsProps) {
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  
  console.log('🏷️ UnifiedSupplierLabels RENDER', {
    transactionIds,
    transactionIdsCount: transactionIds.length,
    companyName
  });
  
  const labelProvider = useLabelDataProvider({
    source: 'supplier',
    transactionIds
  });
  
  console.log('🏷️ Label provider state', {
    isLoading: labelProvider.isLoading,
    error: labelProvider.error,
    labelsCount: labelProvider.labels.length,
    labels: labelProvider.labels
  });

  const handleOpenGenerator = () => {
    setIsGeneratorOpen(true);
  };

  if (labelProvider.isLoading) {
    return (
      <Button disabled className="w-full">
        <Printer className="h-4 w-4 mr-2" />
        Loading Labels...
      </Button>
    );
  }

  if (labelProvider.error || labelProvider.labels.length === 0) {
    return (
      <Button disabled variant="outline" className="w-full">
        <Printer className="h-4 w-4 mr-2" />
        No Labels Available
      </Button>
    );
  }

  return (
    <>
      <Button onClick={handleOpenGenerator} className="w-full">
        <Printer className="h-4 w-4 mr-2" />
        Print {labelProvider.labels.length} Thermal Labels
      </Button>

      <ThermalLabelGenerator
        open={isGeneratorOpen}
        onOpenChange={setIsGeneratorOpen}
        labelSource="supplier"
        dataProvider={labelProvider}
        companyName={companyName}
        isSupplierLabel={true}
        allowUnitSelection={true}
      />
    </>
  );
}