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

export type LabelSource = 'inventory' | 'supplier';

// Properly typed product interface with units
interface ProductWithUnits extends Product {
  units: ProductUnit[];
}

interface InventoryLabelConfig {
  source: 'inventory';
  products: ProductWithUnits[];
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
    config.products.some(p => p.units && p.units.length > 0);

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
        
        inventoryProducts.forEach(product => {
          // Validate product has required fields
          if (!product.brand || !product.model) {
            console.warn('Product missing required fields:', product);
            return;
          }
          
          if (product.units && product.units.length > 0) {
            console.log(`🔍 Processing ${product.units.length} units for product ${product.brand} ${product.model}`);
            
            let productLabelsGenerated = 0;
            product.units.forEach((unit, unitIndex) => {
              console.log(`🔍 Unit ${unitIndex + 1}:`, {
                id: unit.id,
                status: unit.status,
                hasSerial: !!unit.serial_number,
                serialNumber: unit.serial_number,
                hasBarcode: !!unit.barcode,
                hasPrice: !!unit.price
              });
              
              // Include all available units, even those without serial numbers (for bulk products)
              if (unit.status !== 'sold') {
                directLabels.push({
                  id: unit.id,
                  productName: `${product.brand} ${product.model}`,
                  brand: product.brand,
                  model: product.model,
                  serialNumber: unit.serial_number || '', // Allow empty serial for bulk products
                  barcode: unit.barcode || product.barcode || '',
                  price: unit.price || product.price || 0,
                  maxPrice: unit.max_price || product.max_price,
                  minPrice: unit.min_price || product.min_price,
                  category: product.category?.name,
                  color: unit.color,
                  batteryLevel: unit.battery_level,
                  storage: unit.storage,
                  ram: unit.ram
                });
                productLabelsGenerated++;
              } else {
                console.log(`🚫 Skipping sold unit: ${unit.serial_number || unit.id}`);
              }
            });
            
            console.log(`✅ Generated ${productLabelsGenerated} labels for product ${product.brand} ${product.model}`);
          } else {
            console.log(`⚠️ Product ${product.brand} ${product.model} has no units array or empty units`);
          }
        });
        
        console.log(`Generated ${directLabels.length} labels from preloaded units`);
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