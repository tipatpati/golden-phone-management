/**
 * SIMPLE INVENTORY LABELS
 * Direct inventory data fetching for thermal label printing
 * Mirrors the working supplier approach
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export interface SimpleInventoryLabelData {
  id: string;
  productName: string;
  brand: string;
  model: string;
  price: number;
  maxPrice?: number;
  barcode: string;
  serial?: string;
  color?: string;
  storage?: number;
  ram?: number;
  batteryLevel?: number;
}

/**
 * Fetches inventory product data directly for thermal labels
 * No complex transformations - just direct database data
 */
export function useSimpleInventoryLabels(productIds: string[]) {
  return useQuery({
    queryKey: ["simple-inventory-labels", productIds.join(',')],
    queryFn: async (): Promise<SimpleInventoryLabelData[]> => {
      if (!productIds.length) return [];

      logger.info('Fetching simple inventory label data', { productIds });

      // Direct query for product data
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          brand,
          model,
          barcode,
          price,
          max_price,
          stock
        `)
        .in('id', productIds);

      if (error) {
        logger.error('Failed to fetch inventory products', error);
        throw error;
      }

      if (!products?.length) {
        logger.warn('No products found for inventory labels');
        return [];
      }

      // Fetch product units for products that have them
       const { data: units, error: unitsError } = await supabase
        .from('product_units')
        .select(`
          id,
          serial_number,
          barcode,
          status,
          max_price,
          price,
          product_id,
          storage,
          ram,
          battery_level,
          color
        `)
        .in('product_id', productIds)
        .eq('status', 'available');

      if (unitsError) {
        logger.error('Failed to fetch product units', unitsError);
        throw unitsError;
      }

      // Transform to simple label data
      const labels: SimpleInventoryLabelData[] = [];
      
      for (const product of products) {
        // Find units for this product
        const productUnits = units?.filter(unit => unit.product_id === product.id) || [];

        if (productUnits.length > 0) {
          // Create labels for each unit (with or without serial numbers)
          for (const unit of productUnits) {
            // CRITICAL: Always use max_price (selling price), fallback to unit.price or product max_price
            const sellingPrice = unit.max_price ?? unit.price ?? product.max_price ?? 0;
            
            console.log(`📊 Inventory Label Price Debug - ${unit.serial_number}:`, {
              unit_max_price: unit.max_price,
              unit_price: unit.price,
              product_max_price: product.max_price,
              final_price: sellingPrice
            });

            labels.push({
              id: `${product.id}-${unit.id}`,
              productName: `${product.brand} ${product.model}`,
              brand: product.brand,
              model: product.model,
              price: sellingPrice,
              maxPrice: unit.max_price || product.max_price,
              barcode: unit.barcode || product.barcode || `TEMP-${unit.id}`,
              serial: unit.serial_number || `UNIT-${unit.id}`,
              color: unit.color,
              storage: unit.storage,
              ram: unit.ram,
              batteryLevel: unit.battery_level
            });
          }
        } else {
          // Create generic product labels based on stock
          const labelCount = Math.min(product.stock || 1, 10); // Max 10 labels for bulk products
          for (let i = 0; i < labelCount; i++) {
            labels.push({
              id: `${product.id}-bulk-${i}`,
              productName: `${product.brand} ${product.model}`,
              brand: product.brand,
              model: product.model,
              price: product.max_price || 0, // CRITICAL: max_price (selling price) only
              maxPrice: product.max_price,
              barcode: product.barcode || `TEMP-${product.id}-${i}`,
              serial: undefined,
              color: undefined,
              storage: undefined,
              ram: undefined,
              batteryLevel: undefined
            });
          }
        }
      }

      logger.info(`Generated ${labels.length} simple inventory labels`);
      return labels;
    },
    enabled: productIds.length > 0,
    staleTime: 1000 * 60, // 1 minute
    retry: 2
  });
}