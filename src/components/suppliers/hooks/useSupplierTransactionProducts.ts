import { useQuery } from "@tanstack/react-query";
import { useSupplierTransactionItems } from "@/services/suppliers/SupplierTransactionService";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import type { ProductForLabels } from "@/services/labels/types";

interface ProductUnit {
  id: string;
  serial_number: string;
  barcode?: string;
  price?: number;
  min_price?: number;
  max_price?: number;
  storage?: number;
  ram?: number;
  color?: string;
  battery_level?: number;
  status?: string;
}

interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  stock?: number;
  barcode?: string;
  category?: { name: string };
  year?: number;
  storage?: number;
  ram?: number;
  has_serial?: boolean;
  units?: ProductUnit[];
  serial_numbers?: string[];
}

/**
 * Hook to fetch and transform supplier transaction data for thermal label printing
 * Converts supplier transaction items into the same format used by inventory labels
 */
export function useSupplierTransactionProducts(transactionIds: string[]) {
  const enabledTransactionIds = transactionIds.filter(id => !!id);
  
  return useQuery({
    queryKey: ["supplier-transaction-products", enabledTransactionIds],
    queryFn: async (): Promise<Product[]> => {
      if (enabledTransactionIds.length === 0) {
        logger.warn('No transaction IDs provided for label generation', {}, 'useSupplierTransactionProducts');
        return [];
      }

      logger.info('Fetching supplier transaction products for labels', { 
        transactionCount: enabledTransactionIds.length 
      }, 'useSupplierTransactionProducts');

      try {
        // Fetch transaction items for all provided transaction IDs
        const { data: transactionItems, error: itemsError } = await supabase
          .from("supplier_transaction_items")
          .select(`
            id,
            product_id,
            quantity,
            unit_cost,
            unit_details,
            product_unit_ids,
            products!inner (
              id,
              brand,
              model,
              price,
              barcode,
              year,
              has_serial,
              category_id,
              categories (
                name
              )
            )
          `)
          .in("transaction_id", enabledTransactionIds);

        if (itemsError) {
          logger.error('Failed to fetch transaction items', itemsError, 'useSupplierTransactionProducts');
          throw itemsError;
        }

        if (!transactionItems || transactionItems.length === 0) {
          logger.warn('No transaction items found', { transactionIds: enabledTransactionIds }, 'useSupplierTransactionProducts');
          return [];
        }

        // Group transaction items by product to avoid duplicates
        const productMap = new Map<string, any>();
        const allProductUnitIds: string[] = [];

        transactionItems.forEach(item => {
          const product = item.products;
          if (!product) return;

          // Collect all product unit IDs
          if (item.product_unit_ids && Array.isArray(item.product_unit_ids)) {
            const unitIds = item.product_unit_ids.filter((id: any) => typeof id === 'string');
            allProductUnitIds.push(...unitIds);
          }

          // Group by product ID
          if (!productMap.has(product.id)) {
            productMap.set(product.id, {
              product,
              transactionItems: [item]
            });
          } else {
            productMap.get(product.id)?.transactionItems.push(item);
          }
        });

        // Fetch all product units for the acquired items
        let productUnits: ProductUnit[] = [];
        if (allProductUnitIds.length > 0) {
          try {
            productUnits = await ProductUnitManagementService.getUnitsByIds(allProductUnitIds);
            logger.info('Fetched product units for labels', { 
              unitCount: productUnits.length,
              requestedCount: allProductUnitIds.length 
            }, 'useSupplierTransactionProducts');
          } catch (unitsError) {
            logger.error('Failed to fetch product units', unitsError, 'useSupplierTransactionProducts');
            // Continue without units - some products might not be serialized
          }
        }

        // Transform to inventory-compatible format
        const transformedProducts: Product[] = [];

        productMap.forEach(({ product, transactionItems }) => {
          // Get units for this specific product
          const productUnitsForProduct = productUnits.filter(unit => 
            transactionItems.some(item => 
              item.product_unit_ids && 
              Array.isArray(item.product_unit_ids) && 
              item.product_unit_ids.includes(unit.id)
            )
          );

          // Check if all units are sold - if so, skip this product to prevent infinite loops
          const availableUnits = productUnitsForProduct.filter(unit => unit.status !== 'sold');
          const allUnitsSold = productUnitsForProduct.length > 0 && availableUnits.length === 0;

          if (allUnitsSold) {
            logger.warn('Skipping product with all units sold', { 
              productId: product.id, 
              brand: product.brand, 
              model: product.model,
              totalUnits: productUnitsForProduct.length 
            }, 'useSupplierTransactionProducts');
            return; // Skip this product entirely
          }

          // Extract serial numbers for legacy compatibility (only for non-sold units)
          const serialNumbers = availableUnits
            .filter(unit => unit.serial_number)
            .map(unit => unit.serial_number);

          // Create transaction cost mapping for proper pricing
          const transactionCostMap = new Map<string, number>();
          transactionItems.forEach(item => {
            if (item.product_unit_ids && Array.isArray(item.product_unit_ids)) {
              item.product_unit_ids.forEach((unitId: string) => {
                if (item.unit_cost) {
                  transactionCostMap.set(unitId, item.unit_cost);
                }
              });
            }
          });

          // Enhance units with transaction pricing data
          const enhancedUnits = availableUnits.map(unit => {
            const transactionCost = transactionCostMap.get(unit.id);
            return {
              ...unit,
              // Preserve original unit pricing as base/min price
              price: unit.price,
              min_price: unit.min_price,
              // Use transaction cost as max selling price when available
              max_price: transactionCost || unit.max_price
            };
          });

          const transformedProduct: Product = {
            id: product.id,
            brand: product.brand,
            model: product.model,
            price: product.price,
            barcode: product.barcode,
            year: product.year,
            has_serial: product.has_serial,
            category: product.categories ? { name: product.categories.name } : undefined,
            // Include enhanced units with transaction pricing
            units: enhancedUnits,
            // Legacy compatibility for existing label system
            serial_numbers: serialNumbers.length > 0 ? serialNumbers : undefined
          };

          transformedProducts.push(transformedProduct);
        });

        logger.info('Successfully transformed supplier transaction data for labels', {
          originalTransactionItems: transactionItems.length,
          transformedProducts: transformedProducts.length,
          totalUnits: productUnits.length,
          availableProducts: transformedProducts.length
        }, 'useSupplierTransactionProducts');

        return transformedProducts;

      } catch (error) {
        logger.error('Failed to fetch supplier transaction products', error, 'useSupplierTransactionProducts');
        throw error;
      }
    },
    enabled: enabledTransactionIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Prevent infinite retries on sold transactions
    refetchOnWindowFocus: false, // Prevent refetch that might trigger loops
  });
}