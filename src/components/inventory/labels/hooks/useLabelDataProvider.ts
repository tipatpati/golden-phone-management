/**
 * Unified Label Data Provider
 * Provides a common interface for both inventory and supplier label data
 */

import { useState, useEffect, useCallback } from "react";
import { ThermalLabelData } from "../types";
import { ThermalLabelDataService } from "@/services/labels/ThermalLabelDataService";
import { mapProductsForLabels } from "@/utils/mapProductForLabels";
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

  // For supplier labels
  const supplierQuery = useSimpleThermalLabels(
    config.source === 'supplier' ? config.transactionIds : []
  );

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

  useEffect(() => {
    const generateLabels = async () => {
      if (config.source === 'inventory') {
        if (config.products.length === 0) {
          setLabels([]);
          return;
        }

        const maxRetries = 3;
        const retryDelay = 1000 * Math.pow(2, retryCount);

        setIsLoading(true);
        setError(null);

        try {
          logger.info('Generating inventory labels', { productCount: config.products.length }, 'useLabelDataProvider');
          
          const standardizedProducts = mapProductsForLabels(config.products);
          const result = await ThermalLabelDataService.generateLabelsForProducts(
            standardizedProducts,
            { useMasterBarcode: config.useMasterBarcode }
          );

          if (result.errors.length > 0) {
            logger.error('Label generation errors', { errors: result.errors }, 'useLabelDataProvider');
          }
          
          setLabels(result.labels);
          setRetryCount(0); // Reset on success
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to generate labels');
          logger.error('Label generation failed', error, 'useLabelDataProvider');
          
          // Check if this is a network error that might benefit from retry
          const isNetworkError = error.message.includes('Failed to fetch') || 
                                error.message.includes('network') || 
                                error.message.includes('timeout');
          
          if (isNetworkError && retryCount < maxRetries) {
            logger.warn(`Retrying label generation (attempt ${retryCount + 1}/${maxRetries + 1})`, { delay: retryDelay }, 'useLabelDataProvider');
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, retryDelay);
            return;
          }
          
          setError(error);
          setLabels([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    generateLabels();
  }, [config, refreshKey, retryCount]);

  // Handle supplier labels
  useEffect(() => {
    if (config.source === 'supplier') {
      setIsLoading(supplierQuery.isLoading);
      setError(supplierQuery.error);
      
      if (supplierQuery.data) {
        const convertedLabels = convertSupplierLabels(supplierQuery.data);
        setLabels(convertedLabels);
      } else {
        setLabels([]);
      }
    }
  }, [config.source, supplierQuery.data, supplierQuery.isLoading, supplierQuery.error, convertSupplierLabels]);

  return {
    labels,
    isLoading,
    error,
    refresh
  };
}