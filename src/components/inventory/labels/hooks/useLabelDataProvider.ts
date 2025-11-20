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

  console.log('📋 useLabelDataProvider INIT', {
    config,
    source: config.source,
    transactionIds: config.source === 'supplier' ? config.transactionIds : undefined,
    productIds: config.source === 'inventory' ? config.productIds : undefined
  });

  // Direct database queries for both sources
  const supplierQuery = useSimpleThermalLabels(
    config.source === 'supplier' ? config.transactionIds : []
  );

  const inventoryQuery = useSimpleInventoryLabels(
    config.source === 'inventory' ? config.productIds : []
  );
  
  console.log('📋 Query states', {
    source: config.source,
    supplierQuery: config.source === 'supplier' ? {
      isLoading: supplierQuery.isLoading,
      error: supplierQuery.error,
      dataCount: supplierQuery.data?.length || 0
    } : 'not used',
    inventoryQuery: config.source === 'inventory' ? {
      isLoading: inventoryQuery.isLoading,
      error: inventoryQuery.error,
      dataCount: inventoryQuery.data?.length || 0
    } : 'not used'
  });

  const refresh = useCallback(() => {
    console.log('🔄 useLabelDataProvider refresh called', { source: config.source });
    setError(null);
    if (config.source === 'supplier') {
      supplierQuery.refetch();
    } else {
      inventoryQuery.refetch();
    }
    setRefreshKey(prev => prev + 1);
  }, [config.source, supplierQuery, inventoryQuery]);

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

    console.log('📋 Supplier effect triggered', {
      isLoading: supplierQuery.isLoading,
      error: supplierQuery.error,
      dataCount: supplierQuery.data?.length || 0,
      data: supplierQuery.data
    });

    if (supplierQuery.isLoading) {
      console.log('⏳ Supplier query is loading...');
      setIsLoading(true);
      return;
    }

    if (supplierQuery.error) {
      console.error('❌ Supplier query error', supplierQuery.error);
      setError(supplierQuery.error instanceof Error ? supplierQuery.error : new Error('Failed to load supplier labels'));
      setIsLoading(false);
      return;
    }

    if (supplierQuery.data) {
      console.log('✅ Supplier query data received', {
        count: supplierQuery.data.length,
        data: supplierQuery.data
      });
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
