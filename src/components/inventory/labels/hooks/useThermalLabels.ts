import { useMemo } from "react";
import { ThermalLabelData } from "../types";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";
import { formatProductName, formatProductUnitName } from "@/utils/productNaming";

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  stock?: number;
  serial_numbers?: string[];
  category?: { name: string };
  year?: number;
  barcode?: string; // Add the barcode field
}

export function useThermalLabels(products: Product[]): ThermalLabelData[] {
  return useMemo(() => {
    const labels: ThermalLabelData[] = [];

    products.forEach(product => {
      // Clean the brand and model by removing all color info in parentheses
      const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
      const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
      
      if (product.serial_numbers && product.serial_numbers.length > 0) {
        // Generate one label per serial number
        product.serial_numbers.forEach(serialNumber => {
          const parsed = parseSerialWithBattery(serialNumber);
          // Use product's barcode if available, otherwise generate based on IMEI/serial
          const barcode = product.barcode || generateSKUBasedBarcode(parsed.serial, product.id, parsed.batteryLevel);
          
          // Apply "Brand Model Storage" naming convention
          const labelProductName = formatProductUnitName({
            brand: cleanBrand,
            model: cleanModel,
            storage: parsed.storage,
            color: parsed.color
          });
          
          const labelData = {
            productName: labelProductName,
            serialNumber: parsed.serial,
            barcode,
            price: product.price,
            category: product.category?.name,
            color: parsed.color,
            batteryLevel: parsed.batteryLevel,
            storage: parsed.storage,
            ram: parsed.ram
          };
          console.log('Label data for serial:', serialNumber, labelData);
          labels.push(labelData);
        });
      } else {
        // For products without serial numbers, generate one label per stock unit (max 10)
        const quantity = Math.max(1, Math.min(product.stock || 1, 10));
        const productName = formatProductName({ 
          brand: cleanBrand, 
          model: cleanModel 
        });
        
        for (let i = 0; i < quantity; i++) {
          // Use product's barcode if available, otherwise generate unique barcode per unit
          const barcode = product.barcode || generateSKUBasedBarcode(`${productName}-${i + 1}`, product.id);
          
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