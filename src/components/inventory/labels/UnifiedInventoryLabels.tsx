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
  
  // Enhanced validation with proper type checking
  const hasValidProducts = products && products.length > 0;
  
  // Check for available units with proper field mapping
  const hasAvailableUnits = hasValidProducts && products.some(p => {
    // Handle both 'units' and legacy 'product_units' fields from database
    const units = p.units || p.product_units || [];
    return units.length > 0 && units.some((u: any) => u.status !== 'sold');
  });
  
  // Additional validation for bulk products without units
  const hasBulkProducts = hasValidProducts && products.some(p => !p.has_serial && (p.stock || 0) > 0);
  
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

  // Enhanced error handling with proper validation
  if (labelDataProvider.error || (!hasAvailableUnits && !hasBulkProducts) || !labelDataProvider.labels || labelDataProvider.labels.length === 0) {
    const errorMessage = labelDataProvider.error 
      ? "Error Loading Labels" 
      : (!hasAvailableUnits && !hasBulkProducts)
        ? "No Available Products" 
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