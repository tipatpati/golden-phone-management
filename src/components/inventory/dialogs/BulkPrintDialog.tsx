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
  // Generate individual labels for each unit across all products
  const generateLabelsForAllProducts = () => {
    const allLabels: any[] = [];
    
    products.forEach(product => {
      // Clean the brand and model by removing all color info in parentheses
      const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
      const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
      
      if (product.serial_numbers && product.serial_numbers.length > 0) {
        // Generate one label per serial number
        product.serial_numbers.forEach(serialNumber => {
          const parsed = parseSerialString(serialNumber);
          
          allLabels.push({
            productName: formatProductUnitName({
              brand: cleanBrand,
              model: cleanModel,
              storage: parsed.storage,
              color: parsed.color
            }),
            serialNumber: parsed.serial,
            barcode: product.barcode || `${cleanBrand}-${cleanModel}-${parsed.serial}`,
            price: product.price,
            category: product.category?.name,
            color: parsed.color,
            batteryLevel: parsed.batteryLevel
          });
        });
      } else {
        // For products without serial numbers, generate based on stock (max 10)
        const quantity = Math.max(1, Math.min(product.stock || 1, 10));
        const productName = formatProductName({ 
          brand: cleanBrand, 
          model: cleanModel 
        });
        
        for (let i = 0; i < quantity; i++) {
          allLabels.push({
            productName,
            serialNumber: undefined,
            barcode: product.barcode || `${cleanBrand}-${cleanModel}-${i + 1}`,
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