import { useState, useEffect, useCallback } from "react";
import { ThermalLabelData } from "../types";
import { ThermalLabelDataService } from "@/services/labels/ThermalLabelDataService";
import { ProductForLabels } from "@/services/labels/types";
import { mapProductsForLabels } from "@/utils/mapProductForLabels";
import { logger } from "@/utils/logger";

export function useThermalLabels(products: any[], useMasterBarcode?: boolean): ThermalLabelData[] {
  const [labels, setLabels] = useState<ThermalLabelData[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Global refresh function for external triggers
  const forceRefresh = useCallback(() => {
    logger.info('Force refreshing thermal labels', {}, 'useThermalLabels');
    setRefreshKey(prev => prev + 1);
  }, []);
  
  // Expose refresh function globally
  useEffect(() => {
    (window as any).__refreshThermalLabels = forceRefresh;
    return () => {
      delete (window as any).__refreshThermalLabels;
    };
  }, [forceRefresh]);

  // Main effect to generate labels when products change
  useEffect(() => {
    const generateLabels = async () => {
      if (products.length === 0) {
        logger.warn('No products provided for thermal label generation', {}, 'useThermalLabels');
        setLabels([]);
        return;
      }

      logger.info('Starting thermal label generation', { productCount: products.length }, 'useThermalLabels');
      
      // Ensure products are in standardized format before processing
      const standardizedProducts = mapProductsForLabels(products);
      logger.info('Standardized product data for processing', {}, 'useThermalLabels');
      
      try {
        const result = await ThermalLabelDataService.generateLabelsForProducts(
          standardizedProducts,
          { useMasterBarcode }
        );

        // Log results
        logger.info('Thermal label generation completed', result.stats, 'useThermalLabels');
        
        if (result.errors.length > 0) {
          logger.error('Thermal label generation errors', { errors: result.errors }, 'useThermalLabels');
        }
        
        if (result.warnings.length > 0) {
          logger.warn('Thermal label generation warnings', { warnings: result.warnings }, 'useThermalLabels');
        }

        setLabels(result.labels);
        
      } catch (error) {
        logger.error('Thermal label generation failed', error, 'useThermalLabels');
        setLabels([]);
      }
    };

    generateLabels();
  }, [products, useMasterBarcode, refreshKey]);

  return labels;
}