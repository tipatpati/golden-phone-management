/**
 * Unified Label Data Provider
 * Provides a common interface for both inventory and supplier label data
 */

import { useState, useEffect, useCallback } from "react";
import { ThermalLabelData } from "../types";
import { useSimpleInventoryLabels } from "./useSimpleInventoryLabels";
import { useSimpleThermalLabels } from "@/components/suppliers/hooks/useSimpleThermalLabels";
import { logger } from "@/utils/logger";
import type { Product, ProductUnit } from "@/services/inventory/types";

/**
 * Sanitizes label data by unwrapping any corrupted {_type, value} objects
 * This fixes data corruption from serialization/deserialization
 */
function sanitizeLabelData(label: any): ThermalLabelData {
  const unwrap = (value: any) => {
    // If value is an object with _type and value properties, unwrap it
    if (value && typeof value === 'object' && '_type' in value && 'value' in value) {
      console.warn('🔧 Unwrapping corrupted value:', value);
      // Return undefined if value is "undefined" string
      return value.value === 'undefined' ? undefined : value.value;
    }
    return value;
  };

  return {
    id: unwrap(label.id),
    productName: unwrap(label.productName) || 'Unknown Product',
    brand: unwrap(label.brand),
    model: unwrap(label.model),
    serialNumber: unwrap(label.serialNumber),
    barcode: unwrap(label.barcode) || '',
    price: typeof unwrap(label.price) === 'number' ? unwrap(label.price) : 0,
    maxPrice: unwrap(label.maxPrice),
    minPrice: unwrap(label.minPrice),
    category: unwrap(label.category),
    color: unwrap(label.color),
    batteryLevel: unwrap(label.batteryLevel),
    storage: unwrap(label.storage),
    ram: unwrap(label.ram)
  };
}

export type LabelSource = 'inventory' | 'supplier';

// Properly typed product interface with units
interface ProductWithUnits extends Product {
  units: ProductUnit[];
}

interface InventoryLabelConfig {
  source: 'inventory';
  products: Product[];
  useMasterBarcode?: boolean;
}

interface SupplierLabelConfig {
  source: 'supplier';
  transactionIds: string[];
}

export type LabelDataConfig = InventoryLabelConfig | SupplierLabelConfig;

interface UseLabelDataProviderResult {
  labels: ThermalLabelData[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useLabelDataProvider(config: LabelDataConfig): UseLabelDataProviderResult {
  const [labels, setLabels] = useState<ThermalLabelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Check if products already have units data (direct use case) 
  const hasPreloadedUnits = config.source === 'inventory' && 
    config.products.length > 0 && 
    config.products.some(p => {
      // Check both 'units' and 'product_units' fields for compatibility
      const units = (p as any).units || (p as any).product_units || [];
      return Array.isArray(units) && units.length > 0;
    });

  // For supplier labels
  const supplierQuery = useSimpleThermalLabels(
    config.source === 'supplier' ? config.transactionIds : []
  );

  // For inventory labels - only extract product IDs if we need to re-query
  const inventoryProductIds = (config.source === 'inventory' && !hasPreloadedUnits) 
    ? config.products.map(p => p.id).filter(Boolean) 
    : [];
  const inventoryQuery = useSimpleInventoryLabels(inventoryProductIds);

  const refresh = useCallback(() => {
    setRetryCount(0);
    setError(null);
    setRefreshKey(prev => prev + 1);
  }, []);

  // Convert supplier label data to thermal label format
  const convertSupplierLabels = useCallback((supplierLabels: any[]): ThermalLabelData[] => {
    return supplierLabels.map(label => ({
      id: label.id,
      productName: label.productName,
      serialNumber: label.serial, // Fix: use 'serial' from SimpleLabelData
      barcode: label.barcode,
      price: label.maxPrice || label.price,
      maxPrice: label.maxPrice,
      storage: label.storage,
      ram: label.ram,
      batteryLevel: label.batteryLevel,
      color: label.color
    }));
  }, []);

  // Handle inventory labels
  useEffect(() => {
    if (config.source === 'inventory') {
      const inventoryProducts = config.products;
      
      // Validate that we have products data
      if (!inventoryProducts || inventoryProducts.length === 0) {
        setIsLoading(false);
        setError(null);
        setLabels([]);
        return;
      }
      
      // If products already have units, use them directly
      if (hasPreloadedUnits) {
        setIsLoading(false);
        setError(null);
        
        const directLabels: ThermalLabelData[] = [];
        const labelGenerationLog: string[] = [];
        
        inventoryProducts.forEach(product => {
          // Validate product has required fields
          const productName = `${product.brand || 'Unknown'} ${product.model || 'Unknown'}`;
          
          if (!product.brand || !product.model) {
            labelGenerationLog.push(`❌ Product missing brand/model: ${JSON.stringify(product)}`);
            return;
          }
          
          // Handle both 'units' and 'product_units' fields for compatibility
          const units = (product as any).units || (product as any).product_units || [];
          
          // FALLBACK: If no units exist, generate ONE label from product-level data
          if (!Array.isArray(units) || units.length === 0) {
            labelGenerationLog.push(`⚠️ Product ${productName} has no units - generating product-level label`);
            
            // Generate a single label using product-level data
            const rawLabel = {
              id: product.id || `product-${Date.now()}`,
              productName,
              brand: product.brand || undefined,
              model: product.model || undefined,
              serialNumber: undefined,
              barcode: product.barcode || '',
              price: product.price || 0,
              maxPrice: product.max_price || undefined,
              minPrice: product.min_price || undefined,
              category: product.category?.name || undefined,
              color: undefined,
              batteryLevel: undefined,
              storage: product.storage || undefined,
              ram: product.ram || undefined
            };
            
            // Sanitize the label before adding
            const sanitizedLabel = sanitizeLabelData(rawLabel);
            directLabels.push(sanitizedLabel);
            
            labelGenerationLog.push(`✅ Generated 1 product-level label for ${productName}`);
            return;
          }
          
          labelGenerationLog.push(`🔍 Processing ${units.length} units for ${productName}`);
          
          let productLabelsGenerated = 0;
          let skippedUnits = 0;
          
          units.forEach((unit, unitIndex) => {
            // Log unit details for debugging
            labelGenerationLog.push(`  Unit ${unitIndex + 1}: status=${unit.status}, serial=${unit.serial_number || 'none'}, barcode=${unit.barcode ? 'yes' : 'no'}`);
            
            // RELAXED VALIDATION: Include all non-sold units
            if (unit.status === 'sold') {
              labelGenerationLog.push(`    🚫 Skipped (sold)`);
              skippedUnits++;
              return;
            }
            
            // Generate label with fallback values - using explicit undefined instead of nullish values
            const rawLabel = {
              id: unit.id || `unit-${product.id}-${unitIndex}`,
              productName,
              brand: product.brand || undefined,
              model: product.model || undefined,
              serialNumber: unit.serial_number || undefined,
              barcode: unit.barcode || product.barcode || '',
              price: unit.price !== null && unit.price !== undefined ? unit.price : (product.price || 0),
              maxPrice: unit.max_price !== null && unit.max_price !== undefined ? unit.max_price : product.max_price,
              minPrice: unit.min_price !== null && unit.min_price !== undefined ? unit.min_price : product.min_price,
              category: product.category?.name || undefined,
              color: unit.color || undefined,
              batteryLevel: unit.battery_level !== null && unit.battery_level !== undefined ? unit.battery_level : undefined,
              storage: unit.storage !== null && unit.storage !== undefined ? unit.storage : product.storage,
              ram: unit.ram !== null && unit.ram !== undefined ? unit.ram : product.ram
            };
            
            // Sanitize the label before adding
            const sanitizedLabel = sanitizeLabelData(rawLabel);
            directLabels.push(sanitizedLabel);
            
            productLabelsGenerated++;
            labelGenerationLog.push(`    ✅ Label generated`);
          });
          
          labelGenerationLog.push(`✅ Product ${productName}: ${productLabelsGenerated} labels generated, ${skippedUnits} units skipped`);
        });
        
        // Enhanced logging with summary
        console.group('📋 Label Generation Summary');
        console.log(`Total products processed: ${inventoryProducts.length}`);
        console.log(`Total labels generated: ${directLabels.length}`);
        console.log('\nSample label data (first label):');
        if (directLabels.length > 0) {
          console.log(JSON.stringify(directLabels[0], null, 2));
        }
        console.log('\nDetailed log:');
        labelGenerationLog.forEach(log => console.log(log));
        console.groupEnd();
        
        setLabels(directLabels);
        return;
      }
      
      // Fallback to database query approach
      setIsLoading(inventoryQuery.isLoading);
      setError(inventoryQuery.error);
      
      if (inventoryQuery.data) {
        const convertedLabels = inventoryQuery.data.map(label => ({
          id: label.id,
          productName: label.productName,
          brand: label.brand,
          model: label.model,
          serialNumber: label.serial,
          barcode: label.barcode,
          price: label.price,
          maxPrice: label.maxPrice,
          minPrice: undefined,
          category: undefined,
          color: label.color,
          batteryLevel: label.batteryLevel,
          storage: label.storage,
          ram: label.ram
        }));
        setLabels(convertedLabels);
      } else {
        setLabels([]);
      }
    }
  }, [config.source, config.source === 'inventory' ? config.products : [], hasPreloadedUnits, inventoryQuery.data, inventoryQuery.isLoading, inventoryQuery.error]);

  // Handle supplier labels
  useEffect(() => {
    if (config.source === 'supplier') {
      console.log("🔍 Supplier query state:", {
        isLoading: supplierQuery.isLoading,
        error: supplierQuery.error,
        dataLength: supplierQuery.data?.length,
        data: supplierQuery.data
      });
      
      setIsLoading(supplierQuery.isLoading);
      setError(supplierQuery.error);
      
      if (supplierQuery.data) {
        const convertedLabels = convertSupplierLabels(supplierQuery.data);
        console.log("🔍 Converted supplier labels:", convertedLabels);
        setLabels(convertedLabels);
      } else {
        console.log("🔍 No supplier data, setting empty labels");
        setLabels([]);
      }
    }
  }, [config.source, supplierQuery.data, supplierQuery.isLoading, supplierQuery.error, convertSupplierLabels]);

  console.log("🔍 Final useLabelDataProvider result:", {
    labelsCount: labels.length,
    labels: labels,
    isLoading,
    error
  });

  return {
    labels,
    isLoading,
    error,
    refresh
  };
}