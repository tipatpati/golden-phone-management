import React from "react";
import { ThermalLabelGenerator, useThermalLabels } from "../labels";

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
  // Generate individual labels for each unit across all products
  const generateLabelsForAllProducts = () => {
    const allLabels: any[] = [];
    
    products.forEach(product => {
      const productName = `${product.brand} ${product.model}${product.year ? ` (${product.year})` : ''}`;
      
      if (product.serial_numbers && product.serial_numbers.length > 0) {
        // Generate one label per serial number
        product.serial_numbers.forEach(serialNumber => {
          const parts = serialNumber.split(' ');
          const serial = parts[0];
          const color = parts.find(part => !part.includes('%') && part !== serial);
          const batteryPart = parts.find(part => part.includes('%'));
          const batteryLevel = batteryPart ? parseInt(batteryPart.replace('%', '')) : undefined;
          
          allLabels.push({
            productName,
            serialNumber: serial,
            barcode: product.barcode || `${product.brand}-${product.model}-${serial}`,
            price: product.price,
            category: product.category?.name,
            color,
            batteryLevel
          });
        });
      } else {
        // For products without serial numbers, generate based on stock (max 10)
        const quantity = Math.max(1, Math.min(product.stock || 1, 10));
        for (let i = 0; i < quantity; i++) {
          allLabels.push({
            productName,
            serialNumber: undefined,
            barcode: product.barcode || `${product.brand}-${product.model}-${i + 1}`,
            price: product.price,
            category: product.category?.name
          });
        }
      }
    });
    
    return allLabels;
  };

  const thermalLabels = generateLabelsForAllProducts();

  return (
    <ThermalLabelGenerator
      open={open}
      onOpenChange={onOpenChange}
      labels={thermalLabels}
      companyName="GOLDEN PHONE SRL"
    />
  );
}