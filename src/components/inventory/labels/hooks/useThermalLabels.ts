import { useMemo, useState, useEffect, useCallback } from "react";
import { ThermalLabelData } from "../types";
import { Code128GeneratorService } from "@/services/barcodes";

import { formatProductName, formatProductUnitName } from "@/utils/productNaming";
import { ProductUnitsService, ProductUnit } from "@/services/products/ProductUnitsService";

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
  const [labels, setLabels] = useState<ThermalLabelData[]>([]);
  
  // Add a global refresh function
  const forceRefresh = useCallback(() => {
    console.log('🔄 THERMAL LABELS: Force refreshing...');
    setRefreshKey(prev => prev + 1);
    setLabels([]); // Clear labels to force regeneration
  }, []);
  
  // Expose refresh function globally for product updates
  useEffect(() => {
    (window as any).__refreshThermalLabels = forceRefresh;
    return () => {
      delete (window as any).__refreshThermalLabels;
    };
  }, [forceRefresh]);

  useEffect(() => {
    const fetchProductUnits = async () => {
      console.log('🔄 THERMAL LABELS: Starting to fetch product units with refresh key:', refreshKey);
      console.log('🔄 THERMAL LABELS: Products to fetch units for:', products.map(p => ({ id: p.id, serialCount: p.serial_numbers?.length || 0 })));
      
      const unitsMap: Record<string, ProductUnit[]> = {};
      
      for (const product of products) {
        if (product.serial_numbers && product.serial_numbers.length > 0) {
          try {
            console.log(`🔍 THERMAL LABELS: Fetching units for product ${product.id}...`);
            const units = await ProductUnitsService.getUnitsForProduct(product.id);
            console.log(`✅ THERMAL LABELS: Fetched ${units.length} units for product ${product.id}:`, 
              units.map(u => ({
                serial: u.serial_number,
                storage: u.storage,
                ram: u.ram,
                price: u.price,
                min_price: u.min_price,
                max_price: u.max_price,
                color: u.color,
                battery: u.battery_level
              }))
            );
            unitsMap[product.id] = units;
          } catch (error) {
            console.error(`❌ THERMAL LABELS: Failed to fetch units for product ${product.id}:`, error);
            unitsMap[product.id] = [];
          }
        } else {
          console.log(`⚠️ THERMAL LABELS: Product ${product.id} has no serial numbers, skipping unit fetch`);
        }
      }
      
      console.log('📦 THERMAL LABELS: Final units map:', unitsMap);
      setProductUnits(unitsMap);
    };

    if (products.length > 0) {
      console.log('🚀 THERMAL LABELS: Products available, starting fetch...');
      fetchProductUnits();
    } else {
      console.log('⚠️ THERMAL LABELS: No products provided, skipping fetch');
    }
  }, [products, refreshKey]);

  // Force refresh when component mounts or products change
  useEffect(() => {
    const productIds = products.map(p => p.id).join(',');
    console.log('🔄 THERMAL LABELS: Products changed, forcing refresh for product IDs:', productIds);
    setRefreshKey(prev => {
      const newKey = prev + 1;
      console.log('🔄 THERMAL LABELS: Refresh key updated:', prev, '->', newKey);
      return newKey;
    });
  }, [products.map(p => p.id).join(',')]);  // Trigger when product IDs change

  // Generate labels asynchronously when products or units change
  useEffect(() => {
    const generateLabels = async () => {
      console.log('🏷️ THERMAL LABELS: Starting label generation...');
      console.log('🏷️ THERMAL LABELS: Products for label generation:', products.length);
      console.log('🏷️ THERMAL LABELS: Product units available:', Object.keys(productUnits).length);
      console.log('🏷️ THERMAL LABELS: Product units data:', productUnits);
      
      const newLabels: ThermalLabelData[] = [];

      for (const product of products) {
        console.log(`\n🏷️ PROCESSING PRODUCT: ${product.id} (${product.brand} ${product.model})`);
        
        // Clean the brand and model by removing all color info in parentheses
        const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
        const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
        
        if (product.serial_numbers && product.serial_numbers.length > 0) {
          const units = productUnits[product.id] || [];
          console.log(`📱 Product has ${product.serial_numbers.length} serial numbers`);
          console.log(`📦 Found ${units.length} units in database for this product`);
          
          // Generate labels from product units data directly (no parsing)
          for (const [index, unit] of units.entries()) {
            console.log(`\n🔍 Processing unit ${index + 1}/${units.length}: ${unit.serial_number}`);
            console.log('📝 Unit data:', {
              id: unit.id,
              serial: unit.serial_number,
              storage: unit.storage,
              ram: unit.ram,
              price: unit.price,
              min_price: unit.min_price,
              max_price: unit.max_price,
              color: unit.color,
              battery_level: unit.battery_level
            });
            
            // Use professional barcode from database or generate one
            let barcode = unit.barcode;
            if (!barcode) {
              // Generate professional CODE128 barcode for this unit
              try {
                barcode = await Code128GeneratorService.generateUnitBarcode(unit.id, {
                  metadata: {
                    serial: unit.serial_number,
                    product_id: product.id,
                    color: unit.color,
                    storage: unit.storage,
                    ram: unit.ram,
                    battery_level: unit.battery_level
                  }
                });
                console.log(`✅ Generated professional barcode for unit ${unit.serial_number}: ${barcode}`);
              } catch (error) {
                console.error(`❌ Failed to generate barcode for unit ${unit.serial_number}:`, error);
                barcode = `GPMSU${unit.id.replace(/-/g, '').slice(-6)}`;
              }
            }
            
            // Use unit data directly (no fallbacks to parsed data)
            const storage = unit.storage || product.storage || 128;
            const ram = unit.ram || product.ram || 6;
            
            console.log('💾 Storage/RAM resolution:', {
              final: { storage, ram },
              sources: {
                unit: { storage: unit.storage, ram: unit.ram },
                product: { storage: product.storage, ram: product.ram },
                defaults: { storage: 128, ram: 6 }
              }
            });
            
            // Apply "Brand Model Storage" naming convention
            const labelProductName = formatProductUnitName({
              brand: cleanBrand,
              model: cleanModel,
              storage,
              color: unit.color
            });
            
            // Price hierarchy: unit max_price > unit price > product max_price > product price > 0
            const labelPrice = unit.price ?? product.price ?? 0;
            const labelMaxPrice = unit.max_price ?? product.max_price ?? null;
            
            console.log('💰 Price resolution:', {
              finalPrice: labelPrice,
              finalMaxPrice: labelMaxPrice,
              sources: {
                unitMaxPrice: unit.max_price,
                productMaxPrice: product.max_price,
                unitPrice: unit.price,
                productPrice: product.price
              }
            });
            
            const labelData: ThermalLabelData = {
              productName: labelProductName,
              serialNumber: unit.serial_number,
              barcode,
              price: labelPrice,
              maxPrice: labelMaxPrice,
              category: product.category?.name,
              color: unit.color,
              batteryLevel: unit.battery_level,
              storage,
              ram
            };
            
            newLabels.push(labelData);
            
            console.log('✅ Created label:', {
              productName: labelProductName,
              serialNumber: unit.serial_number,
              unitId: unit.id,
              barcode: barcode, // Log the actual barcode being used
              price: labelPrice,
              maxPrice: labelMaxPrice,
              storage,
              ram,
              color: unit.color,
              batteryLevel: unit.battery_level
            });
          }
        } else {
          // For products without serial numbers, generate one label per stock unit (max 10)
          console.log(`📦 Product has no serial numbers, generating ${Math.min(product.stock || 1, 10)} generic labels`);
          
          const quantity = Math.max(1, Math.min(product.stock || 1, 10));
          const productName = formatProductName({ 
            brand: cleanBrand, 
            model: cleanModel 
          });
          
          for (let i = 0; i < quantity; i++) {
            // Generate unique barcode for each bulk item
            const barcode = product.barcode || `GPMSBULK${product.id.slice(-4)}${i.toString().padStart(3, '0')}`;
            
            const labelData = {
              productName,
              barcode,
              // Always use max selling price for labels (product max price or default price)
              price: product.max_price ?? product.price ?? 0,
              category: product.category?.name,
              storage: product.storage || 128, // Default storage if missing
              ram: product.ram || 6 // Default RAM if missing
            };
            
            newLabels.push(labelData);
            
            console.log(`✅ Created generic label ${i + 1}:`, labelData);
          }
        }
      }

      console.log(`🏷️ THERMAL LABELS: Generated ${newLabels.length} total labels`);
      console.log('🏷️ THERMAL LABELS: Final labels:', newLabels.map(l => ({
        name: l.productName,
        serial: l.serialNumber,
        price: l.price,
        storage: l.storage,
        ram: l.ram
      })));

      setLabels(newLabels);
    };

    generateLabels();
  }, [products, productUnits, useMasterBarcode]);

  return labels;
}