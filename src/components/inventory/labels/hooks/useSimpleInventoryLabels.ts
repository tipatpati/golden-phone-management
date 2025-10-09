/**
 * SIMPLE INVENTORY LABELS
 * Direct inventory data fetching for thermal label printing
 * Returns ThermalLabelData directly - no transformations needed
 * 
 * CRITICAL: Always uses max_price (selling price), NEVER unit.price (cost price)
 * Version: 2.0 - Refactored price logic
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThermalLabelData } from "@/services/labels/types";
import { logger } from "@/utils/logger";

/**
 * Fetches inventory product data directly for thermal labels
 * No complex transformations - just direct database data
 */
export function useSimpleInventoryLabels(productIds: string[]) {
  return useQuery({
    queryKey: ["simple-inventory-labels", productIds.join(',')],
    queryFn: async (): Promise<ThermalLabelData[]> => {
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

      // Transform to ThermalLabelData directly
      const labels: ThermalLabelData[] = [];
      
      console.log('🔵 DATABASE QUERY RESULTS:', {
        productsCount: products.length,
        unitsCount: units?.length || 0,
        firstProduct: products[0] ? {
          id: products[0].id,
          brand: products[0].brand,
          model: products[0].model,
          price: products[0].price,
          max_price: products[0].max_price
        } : null,
        firstUnit: units?.[0] ? {
          id: units[0].id,
          serial_number: units[0].serial_number,
          price: units[0].price,
          max_price: units[0].max_price
        } : null
      });
      
      for (const product of products) {
        // Find units for this product
        const productUnits = units?.filter(unit => unit.product_id === product.id) || [];

        if (productUnits.length > 0) {
          // Create labels for each unit
          for (const unit of productUnits) {
            // CRITICAL PRICE LOGIC:
            // For inventory labels, ALWAYS use max_price (selling price)
            // NEVER use unit.price (which is purchase/cost price)
            const sellingPrice = unit.max_price || product.max_price || 0;
            
            console.log(`🟢 LABEL PRICE - Serial ${unit.serial_number}:`, {
              unit_max_price: unit.max_price,
              unit_price: unit.price,
              product_max_price: product.max_price,
              product_price: product.price,
              SELECTED_SELLING_PRICE: sellingPrice,
              explanation: 'Using unit.max_price (selling price), NOT unit.price (cost price)'
            });
            
            const labelData: ThermalLabelData = {
              id: `${product.id}-${unit.id}`,
              productName: `${product.brand} ${product.model}`,
              brand: product.brand,
              model: product.model,
              serialNumber: unit.serial_number || `UNIT-${unit.id}`,
              barcode: unit.barcode || product.barcode || `TEMP-${unit.id}`,
              price: sellingPrice,  // ✅ This is the SELLING price (max_price)
              maxPrice: unit.max_price || product.max_price,
              minPrice: product.price,
              color: unit.color,
              storage: unit.storage,
              ram: unit.ram,
              batteryLevel: unit.battery_level
            };
            
            console.log(`✅ LABEL CREATED:`, {
              serial: labelData.serialNumber,
              displayPrice: labelData.price,
              productName: labelData.productName
            });
            
            labels.push(labelData);
          }
        } else {
          // Create generic product labels based on stock (no individual units)
          const labelCount = Math.min(product.stock || 1, 10);
          const sellingPrice = product.max_price || product.price || 0;
          
          console.log(`🟡 BULK LABEL - ${product.brand} ${product.model}:`, {
            product_max_price: product.max_price,
            product_price: product.price,
            SELECTED_SELLING_PRICE: sellingPrice
          });
          
          for (let i = 0; i < labelCount; i++) {
            labels.push({
              id: `${product.id}-bulk-${i}`,
              productName: `${product.brand} ${product.model}`,
              brand: product.brand,
              model: product.model,
              barcode: product.barcode || `TEMP-${product.id}-${i}`,
              price: sellingPrice,  // ✅ Selling price for bulk items
              maxPrice: product.max_price,
              minPrice: product.price
            });
          }
        }
      }

      logger.info(`Generated ${labels.length} simple inventory labels`);
      return labels;
    },
    enabled: productIds.length > 0,
    staleTime: 0, // Always fetch fresh data for label printing
    retry: 2
  });
}