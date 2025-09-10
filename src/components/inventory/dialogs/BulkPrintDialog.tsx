import React from "react";
import { ThermalLabelGenerator, useThermalLabels } from "../labels";
import { mapProductsForLabels } from "@/utils/mapProductForLabels";

interface ProductUnit {
  id: string;
  serial_number: string;
  barcode?: string;
  price?: number;
  min_price?: number;
  max_price?: number;
  storage?: number;
  ram?: number;
  color?: string;
  battery_level?: number;
  status?: string;
}

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  stock?: number;
  barcode?: string;
  category?: { name: string };
  year?: number;
  storage?: number;
  ram?: number;
  has_serial?: boolean;
  // Primary data source for serialized products
  units?: ProductUnit[];
  // Legacy compatibility
  serial_numbers?: string[];
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
  // Transform products to standardized format using units as primary source
  const mappedProducts = mapProductsForLabels(products);
  
  // Use the enhanced useThermalLabels hook for consistent barcode generation
  const thermalLabels = useThermalLabels(mappedProducts);

  return (
    <ThermalLabelGenerator
      open={open}
      onOpenChange={onOpenChange}
      labels={thermalLabels}
      companyName="GOLDEN PHONE SRL"
    />
  );
}