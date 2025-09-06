import { useState, useEffect, useCallback } from "react";
import { ThermalLabelData } from "../types";
import { ThermalLabelDataService } from "@/services/labels/ThermalLabelDataService";
import { ProductForLabels } from "@/services/labels/types";

export function useThermalLabels(products: ProductForLabels[], useMasterBarcode?: boolean): ThermalLabelData[] {
  const [labels, setLabels] = useState<ThermalLabelData[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Global refresh function for external triggers
  const forceRefresh = useCallback(() => {
    console.log('🔄 THERMAL LABELS: Force refreshing...');
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
        console.log('⚠️ THERMAL LABELS: No products provided');
        setLabels([]);
        return;
      }

      console.log('🚀 THERMAL LABELS: Starting generation for', products.length, 'products');
      
      try {
        const result = await ThermalLabelDataService.generateLabelsForProducts(
          products,
          { useMasterBarcode }
        );

        // Log results
        console.log('📊 THERMAL LABELS: Generation results:', result.stats);
        
        if (result.errors.length > 0) {
          console.error('❌ THERMAL LABELS: Errors:', result.errors);
        }
        
        if (result.warnings.length > 0) {
          console.warn('⚠️ THERMAL LABELS: Warnings:', result.warnings);
        }

        setLabels(result.labels);
        
      } catch (error) {
        console.error('💥 THERMAL LABELS: Generation failed:', error);
        setLabels([]);
      }
    };

    generateLabels();
  }, [products, useMasterBarcode, refreshKey]);

  return labels;
}