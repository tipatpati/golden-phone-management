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
      logger.info('Using inventory labels directly', { count: inventoryQuery.data.length });
      setLabels(inventoryQuery.data);
      setError(null);
      setIsLoading(false);
    }
  }, [config.source, inventoryQuery.data, inventoryQuery.isLoading, inventoryQuery.error]);

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
      logger.info('Using supplier labels directly', { count: supplierQuery.data.length });
      setLabels(supplierQuery.data);
      setError(null);
      setIsLoading(false);
    }
  }, [config.source, supplierQuery.data, supplierQuery.isLoading, supplierQuery.error]);

  return {
    labels,
    isLoading,
    error,
    refresh
  };
}
