/**
 * SIMPLE THERMAL LABELS
 * Direct product data fetching for thermal label printing
 * Returns ThermalLabelData directly - no transformations needed
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ThermalLabelData } from "@/services/labels/types";
import { logger } from "@/utils/logger";

/**
 * Fetches product units with all needed data for thermal labels
 * No complex transformations - just direct database data
 */
export function useSimpleThermalLabels(transactionIds: string[]) {
  console.log('🔍 useSimpleThermalLabels HOOK CALLED', {
    transactionIds,
    count: transactionIds.length,
    enabled: transactionIds.length > 0
  });
  
  const query = useQuery({
    queryKey: ["simple-thermal-labels", ...transactionIds],
    queryFn: async (): Promise<ThermalLabelData[]> => {
      console.log('🔍 useSimpleThermalLabels queryFn EXECUTING', { transactionIds });
      
      if (!transactionIds.length) {
        console.warn('❌ No transaction IDs provided for thermal labels');
        logger.warn('No transaction IDs provided for thermal labels');
        return [];
      }

      console.log('✅ Starting to fetch thermal label data', { transactionIds });
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

      logger.info('Fetched supplier transaction items', { 
        count: items?.length || 0,
        items: items 
      });

      if (!items?.length) {
        logger.warn('No items found for thermal labels', { transactionIds });
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

      logger.info('Extracted unit IDs from items', { 
        allUnitIds,
        count: allUnitIds.length 
      });

      if (allUnitIds.length === 0) {
        logger.warn('No unit IDs found in transaction items');
        // Still continue - we can create generic labels for non-serialized products
      }
      
      let units: any[] = [];
      if (allUnitIds.length > 0) {
        const { data: unitsData, error: unitsError } = await supabase
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
          .in('id', allUnitIds);
          // Note: No status filter - supplier labels should show all units from transaction

        if (unitsError) {
          logger.error('Failed to fetch product units', unitsError);
          throw unitsError;
        }

        units = unitsData || [];
        logger.info('Fetched product units', { count: units.length });
      }

      // Transform to ThermalLabelData directly
      const labels: ThermalLabelData[] = [];
      
      for (const item of items) {
        const product = item.products;
        if (!product) continue;

        const productUnits = units.filter(unit => {
          if (!item.product_unit_ids || !Array.isArray(item.product_unit_ids)) return false;
          return item.product_unit_ids.some((id: any) => typeof id === 'string' && id === unit.id);
        });

        // Process serialized units
        for (const unit of productUnits) {
          if (!unit.serial_number) continue;

          // CRITICAL: For supplier labels, use max_price (selling price)
          const sellingPrice = unit.max_price || product.max_price || 0;
          
          console.log(`📦 SUPPLIER LABEL - ${unit.serial_number}:`, {
            unit_max_price: unit.max_price,
            unit_price: unit.price,
            product_max_price: product.max_price,
            SELLING_PRICE: sellingPrice
          });

          labels.push({
            id: `${product.id}-${unit.id}`,
            productName: `${product.brand} ${product.model}`,
            brand: product.brand,
            model: product.model,
            serialNumber: unit.serial_number,
            barcode: unit.barcode || product.barcode || `TEMP-${unit.id}`,
            price: sellingPrice,  // ✅ Selling price
            maxPrice: unit.max_price || product.max_price,
            minPrice: product.price,
            color: unit.color,
            storage: unit.storage,
            ram: unit.ram,
            batteryLevel: unit.battery_level
          });
        }

        // Handle non-serialized products or remaining quantity
        const unitsCount = productUnits.length;
        const totalQuantity = item.quantity || 0;

        if (totalQuantity > unitsCount) {
          // Generate generic labels for non-serialized quantity
          const genericCount = totalQuantity - unitsCount;
          const productBarcode = product.barcode || `PROD-${product.id.slice(-8)}`;
          const sellingPrice = product.max_price || product.price || 0;
          
          console.log(`📦 NON-SERIALIZED LABELS - ${product.brand} ${product.model}:`, {
            total_quantity: totalQuantity,
            units_count: unitsCount,
            generic_labels: genericCount,
            barcode: productBarcode,
            selling_price: sellingPrice
          });

          for (let i = 0; i < genericCount; i++) {
            labels.push({
              id: `${product.id}-generic-${i}`,
              productName: `${product.brand} ${product.model}`,
              brand: product.brand,
              model: product.model,
              serialNumber: undefined, // No serial for generic labels
              barcode: productBarcode,
              price: sellingPrice,
              maxPrice: product.max_price,
              minPrice: product.price,
              // No specific specs for non-serialized items
              color: undefined,
              storage: undefined,
              ram: undefined,
              batteryLevel: undefined
            });
          }
        }
      }

      console.log('✅ Generated thermal labels', { count: labels.length, labels });
      logger.info(`Generated ${labels.length} simple thermal labels`);
      return labels;
    },
    enabled: transactionIds.length > 0,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2
  });
  
  console.log('🔍 Query state', {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    dataCount: query.data?.length || 0,
    status: query.status
  });
  
  return query;
}