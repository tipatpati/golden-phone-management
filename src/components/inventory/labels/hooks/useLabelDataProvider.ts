/**
 * Unified Label Data Provider
 * Uses direct database queries for both inventory and supplier labels
 */

import { useState, useEffect, useCallback } from "react";
import { ThermalLabelData } from "../types";
import { useSimpleInventoryLabels } from "./useSimpleInventoryLabels";
import { useSimpleThermalLabels } from "@/components/suppliers/hooks/useSimpleThermalLabels";
import { logger } from "@/utils/logger";

export type LabelSource = 'inventory' | 'supplier';

export type LabelDataConfig = 
  | { 
      source: 'inventory'; 
      productIds: string[];
      useMasterBarcode?: boolean;
    }
  | { 
      source: 'supplier'; 
      transactionIds: string[];
    };

export interface UseLabelDataProviderResult {
  labels: ThermalLabelData[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useLabelDataProvider(config: LabelDataConfig): UseLabelDataProviderResult {
  const [labels, setLabels] = useState<ThermalLabelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Direct database queries for both sources
  const supplierQuery = useSimpleThermalLabels(
    config.source === 'supplier' ? config.transactionIds : []
  );

  const inventoryQuery = useSimpleInventoryLabels(
    config.source === 'inventory' ? config.productIds : []
  );

  const refresh = useCallback(() => {
    setError(null);
    setRefreshKey(prev => prev + 1);
  }, []);

  // Convert supplier label data to thermal label format
  const convertSupplierLabels = useCallback((supplierLabels: any[]): ThermalLabelData[] => {
    return supplierLabels.map(label => ({
      id: label.id || crypto.randomUUID(),
      productName: label.productName || '',
      brand: label.brand || '',
      model: label.model || '',
      specifications: label.specifications || '',
      price: label.price || 0,
      minPrice: label.minPrice,
      maxPrice: label.maxPrice,
      barcode: label.barcode || '',
      serialNumber: label.serialNumber,
      color: label.color,
      storage: label.storage,
      ram: label.ram,
      batteryLevel: label.batteryLevel,
    }));
  }, []);

  // Convert inventory label data to thermal label format
  const convertInventoryLabels = useCallback((inventoryLabels: any[]): ThermalLabelData[] => {
    console.log('🟡 PROVIDER CONVERSION - Input:', {
      count: inventoryLabels.length,
      firstLabel: inventoryLabels[0] ? {
        serial: inventoryLabels[0].serial,
        price: inventoryLabels[0].price,
        maxPrice: inventoryLabels[0].maxPrice,
        typeof_price: typeof inventoryLabels[0].price,
        typeof_maxPrice: typeof inventoryLabels[0].maxPrice
      } : 'No labels'
    });
    
    return inventoryLabels.map(label => {
      // Prioritize maxPrice for selling price display on labels
      const displayPrice = label.maxPrice || label.price || 0;
      
      console.log('🟡 PROVIDER - Converting label:', {
        serial: label.serial,
        maxPrice: label.maxPrice,
        price: label.price,
        displayPrice,
        logic: `maxPrice(${label.maxPrice}) || price(${label.price}) || 0`
      });
      
      return {
        id: label.id || crypto.randomUUID(),
        productName: `${label.brand || ''} ${label.model || ''}`.trim(),
        brand: label.brand || '',
        model: label.model || '',
        specifications: [
          label.color,
          label.storage ? `${label.storage}GB` : undefined,
          label.ram ? `${label.ram}GB RAM` : undefined,
        ].filter(Boolean).join(' • '),
        price: displayPrice,  // Use max selling price for label display
        minPrice: label.minPrice,
        maxPrice: label.maxPrice,
        barcode: label.barcode || '',
        serialNumber: label.serial,
        color: label.color,
        storage: label.storage,
        ram: label.ram,
        batteryLevel: label.batteryLevel,
      };
    });
  }, []);

  // Handle inventory label data
  useEffect(() => {
    if (config.source !== 'inventory') return;

    if (inventoryQuery.isLoading) {
      setIsLoading(true);
      return;
    }

    if (inventoryQuery.error) {
      logger.error('Inventory query error', { error: inventoryQuery.error });
      setError(inventoryQuery.error instanceof Error ? inventoryQuery.error : new Error('Failed to load inventory labels'));
      setIsLoading(false);
      return;
    }

    if (inventoryQuery.data) {
      logger.info('Converting inventory labels', { count: inventoryQuery.data.length });
      const converted = convertInventoryLabels(inventoryQuery.data);
      setLabels(converted);
      setError(null);
      setIsLoading(false);
    }
  }, [config.source, inventoryQuery.data, inventoryQuery.isLoading, inventoryQuery.error, convertInventoryLabels]);

  // Handle supplier label data
  useEffect(() => {
    if (config.source !== 'supplier') return;

    if (supplierQuery.isLoading) {
      setIsLoading(true);
      return;
    }

    if (supplierQuery.error) {
      setError(supplierQuery.error instanceof Error ? supplierQuery.error : new Error('Failed to load supplier labels'));
      setIsLoading(false);
      return;
    }

    if (supplierQuery.data) {
      logger.info('Converting supplier labels', { count: supplierQuery.data.length });
      const converted = convertSupplierLabels(supplierQuery.data);
      setLabels(converted);
      setError(null);
      setIsLoading(false);
    }
  }, [config.source, supplierQuery.data, supplierQuery.isLoading, supplierQuery.error, convertSupplierLabels]);

  return {
    labels,
    isLoading,
    error,
    refresh
  };
}
