/**
 * SIMPLE THERMAL LABELS
 * Direct product data fetching for thermal label printing
 * Clean, straightforward logic without complex transformations
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface SimpleLabelData {
  id: string;
  productName: string;
  serialNumber: string;
  maxPrice: number;
  barcode: string;
  brand: string;
  model: string;
}

/**
 * Fetches product units with all needed data for thermal labels
 * No complex transformations - just direct database data
 */
export function useSimpleThermalLabels(transactionIds: string[]) {
  return useQuery({
    queryKey: ["simple-thermal-labels", transactionIds.join(',')],
    queryFn: async (): Promise<SimpleLabelData[]> => {
      if (!transactionIds.length) return [];

      logger.info('Fetching simple thermal label data', { transactionIds });

      // Direct query for all needed data
      const { data: items, error } = await supabase
        .from('supplier_transaction_items')
        .select(`
          id,
          quantity,
          unit_cost,
          unit_details,
          product_unit_ids,
          products!inner (
            id,
            brand,
            model,
            barcode,
            price,
            max_price
          )
        `)
        .in('transaction_id', transactionIds);

      if (error) {
        logger.error('Failed to fetch thermal label data', error);
        throw error;
      }

      if (!items?.length) {
        logger.warn('No items found for thermal labels');
        return [];
      }

      // Fetch product units separately
      const allUnitIds: string[] = [];
      items.forEach(item => {
        if (item.product_unit_ids && Array.isArray(item.product_unit_ids)) {
          const unitIds = item.product_unit_ids.filter((id: any) => typeof id === 'string');
          allUnitIds.push(...unitIds);
        }
      });

      
      const { data: units, error: unitsError } = await supabase
        .from('product_units')
        .select(`
          id,
          serial_number,
          barcode,
          status,
          max_price,
          product_id
        `)
        .in('id', allUnitIds)
        .eq('status', 'available');

      if (unitsError) {
        logger.error('Failed to fetch product units', unitsError);
        throw unitsError;
      }

      // Transform to simple label data
      const labels: SimpleLabelData[] = [];
      
      for (const item of items) {
        const product = item.products;
        if (!product) continue;

        // Find units for this product
        const productUnits = units?.filter(unit => {
          if (!item.product_unit_ids || !Array.isArray(item.product_unit_ids)) return false;
          return item.product_unit_ids.some((id: any) => typeof id === 'string' && id === unit.id);
        }) || [];

        for (const unit of productUnits) {
          if (!unit.serial_number) continue;

          labels.push({
            id: `${product.id}-${unit.id}`,
            productName: `${product.brand} ${product.model}`,
            serialNumber: unit.serial_number,
            maxPrice: unit.max_price || product.max_price || 0,
            barcode: unit.barcode || product.barcode || `TEMP-${unit.id}`,
            brand: product.brand,
            model: product.model
          });
        }
      }

      logger.info(`Generated ${labels.length} simple thermal labels`);
      return labels;
    },
    enabled: transactionIds.length > 0,
    staleTime: 1000 * 60, // 1 minute
    retry: 2
  });
}