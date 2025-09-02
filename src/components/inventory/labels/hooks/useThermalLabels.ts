import { useMemo } from "react";
import { ThermalLabelData } from "../types";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  stock?: number;
  serial_numbers?: string[];
  category?: { name: string };
  year?: number;
}

export function useThermalLabels(products: Product[]): ThermalLabelData[] {
  return useMemo(() => {
    const labels: ThermalLabelData[] = [];

    products.forEach(product => {
      const productName = `${product.brand} ${product.model}${product.year ? ` (${product.year})` : ''}`;
      
      if (product.serial_numbers && product.serial_numbers.length > 0) {
        // Generate one label per serial number
        product.serial_numbers.forEach(serialNumber => {
          const parsed = parseSerialWithBattery(serialNumber);
          const barcode = generateSKUBasedBarcode(parsed.serial, product.id, parsed.batteryLevel);
          
          labels.push({
            productName,
            serialNumber: parsed.serial,
            barcode,
            price: product.price,
            category: product.category?.name,
            color: parsed.color,
            batteryLevel: parsed.batteryLevel
          });
        });
      } else {
        // For products without serial numbers, generate one label per stock unit (max 10)
        const quantity = Math.max(1, Math.min(product.stock || 1, 10));
        for (let i = 0; i < quantity; i++) {
          const barcode = generateSKUBasedBarcode(`${productName}-${i + 1}`, product.id);
          
          labels.push({
            productName,
            barcode,
            price: product.price,
            category: product.category?.name
          });
        }
      }
    });

    return labels;
  }, [products]);
}