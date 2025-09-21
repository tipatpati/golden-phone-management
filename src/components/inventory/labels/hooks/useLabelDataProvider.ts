/**
 * Unified Label Data Provider
 * Provides a common interface for both inventory and supplier label data
 */

import { useState, useEffect, useCallback } from "react";
import { ThermalLabelData } from "../types";
import { useSimpleInventoryLabels } from "./useSimpleInventoryLabels";
import { useSimpleThermalLabels } from "@/components/suppliers/hooks/useSimpleThermalLabels";
import { logger } from "@/utils/logger";

export type LabelSource = 'inventory' | 'supplier';

interface InventoryLabelConfig {
  source: 'inventory';
  products: any[];
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

  // Debug logging
  console.log("🔍 useLabelDataProvider - Config received:", {
    source: config.source,
    productsCount: config.source === 'inventory' ? config.products?.length : 'N/A',
    transactionIds: config.source === 'supplier' ? config.transactionIds?.length : 'N/A',
    products: config.source === 'inventory' ? config.products : null
  });

  // For supplier labels
  const supplierQuery = useSimpleThermalLabels(
    config.source === 'supplier' ? config.transactionIds : []
  );

  // For inventory labels - extract product IDs
  const inventoryProductIds = config.source === 'inventory' ? config.products.map(p => p.id).filter(Boolean) : [];
  console.log("🔍 Extracted product IDs:", inventoryProductIds);
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
      console.log("🔍 Inventory query state:", {
        isLoading: inventoryQuery.isLoading,
        error: inventoryQuery.error,
        dataLength: inventoryQuery.data?.length,
        data: inventoryQuery.data
      });
      
      setIsLoading(inventoryQuery.isLoading);
      setError(inventoryQuery.error);
      
      if (inventoryQuery.data) {
        // Convert SimpleInventoryLabelData to ThermalLabelData
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
        console.log("🔍 Converted labels:", convertedLabels);
        setLabels(convertedLabels);
      } else {
        console.log("🔍 No inventory data, setting empty labels");
        setLabels([]);
      }
    }
  }, [config.source, inventoryQuery.data, inventoryQuery.isLoading, inventoryQuery.error]);

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