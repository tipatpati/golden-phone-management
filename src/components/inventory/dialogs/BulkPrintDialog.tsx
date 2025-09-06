import React from "react";
import { ThermalLabelGenerator, useThermalLabels } from "../labels";
import { formatProductName, formatProductUnitName, parseSerialString } from "@/utils/productNaming";

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  stock?: number;
  barcode?: string;
  serial_numbers?: string[];
  category?: { name: string };
  year?: number;
}

interface BulkPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  isLoading?: boolean;
}

export function BulkPrintDialog({
  open,
  onOpenChange,
  products,
  isLoading = false
}: BulkPrintDialogProps) {
  // Use the enhanced useThermalLabels hook for consistent barcode generation
  const thermalLabels = useThermalLabels(products);

  return (
    <ThermalLabelGenerator
      open={open}
      onOpenChange={onOpenChange}
      labels={thermalLabels}
      companyName="GOLDEN PHONE SRL"
    />
  );
}