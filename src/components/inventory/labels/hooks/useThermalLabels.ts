import { useMemo, useState, useEffect } from "react";
import { ThermalLabelData } from "../types";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";
import { formatProductName, formatProductUnitName } from "@/utils/productNaming";
import { ProductUnitsService, ProductUnit } from "@/services/products/productUnitsService";

interface Product {
  id: string;
  brand: string;
  model: string;
  price?: number;      // Optional default price
  min_price?: number;  // Optional default min price
  max_price?: number;  // Optional default max price
  stock?: number;
  serial_numbers?: string[];
  category?: { name: string };
  year?: number;
  barcode?: string;
  storage?: number; // Add storage field
  ram?: number; // Add RAM field
}

export function useThermalLabels(products: Product[], useMasterBarcode?: boolean): ThermalLabelData[] {
  const [productUnits, setProductUnits] = useState<Record<string, ProductUnit[]>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchProductUnits = async () => {
      console.log('Fetching product units for labels with refresh key:', refreshKey);
      const unitsMap: Record<string, ProductUnit[]> = {};
      
      for (const product of products) {
        if (product.serial_numbers && product.serial_numbers.length > 0) {
          try {
            const units = await ProductUnitsService.getUnitsForProduct(product.id);
            console.log(`Fetched ${units.length} units for product ${product.id}:`, units.map(u => ({
              serial: u.serial_number,
              price: u.price,
              min_price: u.min_price,
              max_price: u.max_price
            })));
            unitsMap[product.id] = units;
          } catch (error) {
            console.error(`Failed to fetch units for product ${product.id}:`, error);
            unitsMap[product.id] = [];
          }
        }
      }
      
      setProductUnits(unitsMap);
    };

    if (products.length > 0) {
      fetchProductUnits();
    }
  }, [products, refreshKey]);

  // Force refresh when component mounts or products change
  useEffect(() => {
    const productIds = products.map(p => p.id).join(',');
    console.log('Products changed, forcing refresh for:', productIds);
    setRefreshKey(prev => prev + 1);
  }, [products.map(p => p.id).join(',')]);  // Trigger when product IDs change

  return useMemo(() => {
    const labels: ThermalLabelData[] = [];

    products.forEach(product => {
      // Clean the brand and model by removing all color info in parentheses
      const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
      const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
      
      if (product.serial_numbers && product.serial_numbers.length > 0) {
        const units = productUnits[product.id] || [];
        
        // Generate labels from product units data
        product.serial_numbers.forEach(serialNumber => {
          const parsed = parseSerialWithBattery(serialNumber);
          
          // Find corresponding unit for this serial number
          const unit = units.find(u => u.serial_number === parsed.serial);
          
          // Debug logging
          console.log('Serial parsing for:', serialNumber, {
            parsed,
            unit,
            unitPricing: unit ? {
              price: unit.price,
              min_price: unit.min_price,
              max_price: unit.max_price
            } : null,
            productPricing: {
              price: product.price,
              min_price: product.min_price,
              max_price: product.max_price
            }
          });
          
          // Choose barcode strategy based on useMasterBarcode option
          const barcode = useMasterBarcode && product.barcode 
            ? product.barcode 
            : unit?.barcode || generateSKUBasedBarcode(parsed.serial, product.id, parsed.batteryLevel);
          
          // Get storage and RAM with fallback hierarchy
          const storage = unit?.storage || parsed.storage || product.storage || 128;
          const ram = unit?.ram || parsed.ram || product.ram || 6;
          
          // Apply "Brand Model Storage" naming convention
          const labelProductName = formatProductUnitName({
            brand: cleanBrand,
            model: cleanModel,
            storage,
            color: unit?.color || parsed.color
          });
          
          // Price hierarchy: unit max_price > product max_price > unit price > product price > 0
          const labelPrice = unit?.max_price ?? product.max_price ?? unit?.price ?? product.price ?? 0;
          
          labels.push({
            productName: labelProductName,
            serialNumber: parsed.serial,
            barcode,
            price: labelPrice,
            category: product.category?.name,
            color: unit?.color || parsed.color,
            batteryLevel: unit?.battery_level || parsed.batteryLevel,
            storage,
            ram
          });
          
          // Debug log for each label being created
          console.log('Created label:', {
            productName: labelProductName,
            serialNumber: parsed.serial,
            labelPrice,
            unitMaxPrice: unit?.max_price,
            productMaxPrice: product.max_price,
            finalPrice: labelPrice
          });
        });
      } else {
        // For products without serial numbers, generate one label per stock unit (max 10)
        const quantity = Math.max(1, Math.min(product.stock || 1, 10));
        const productName = formatProductName({ 
          brand: cleanBrand, 
          model: cleanModel 
        });
        
        // Debug logging for products without serial numbers
        console.log('Product without serial numbers:', {
          productName,
          productStorage: product.storage,
          productRam: product.ram
        });
        
        for (let i = 0; i < quantity; i++) {
          // Use product's barcode if available, otherwise generate unique barcode per unit
          const barcode = product.barcode || generateSKUBasedBarcode(`${productName}-${i + 1}`, product.id);
          
          labels.push({
            productName,
            barcode,
            // Always use max selling price for labels (product max price or default price)
            price: product.max_price ?? product.price ?? 0,
            category: product.category?.name,
            storage: product.storage || 128, // Default storage if missing
            ram: product.ram || 6 // Default RAM if missing
          });
        }
      }
    });

    return labels;
  }, [products, productUnits, useMasterBarcode]);
}