/**
 * UNIFIED SUPPLIER LABELS HOOK
 * Replaces obsolete supplier-specific label logic with UniversalBarcodeService integration
 * Provides consistent thermal label generation across supplier module
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { universalBarcodeService } from "@/services/shared/UniversalBarcodeService";
import { logger } from "@/utils/logger";
import type { ThermalLabelData } from "@/services/labels/types";

interface SupplierProduct {
  id: string;
  brand: string;
  model: string;
  price: number;
  barcode?: string; // Added barcode property
  units?: Array<{
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
  }>;
  category?: { name: string };
}

/**
 * Hook that generates thermal labels for supplier products using UniversalBarcodeService
 * Ensures consistent barcode generation and label formatting across supplier transactions
 */
export function useUnifiedSupplierLabels(
  products: SupplierProduct[],
  options: {
    useMasterBarcode?: boolean;
    includePrice?: boolean;
    includeCategory?: boolean;
  } = {}
) {
  const {
    useMasterBarcode = false,
    includePrice = true,
    includeCategory = true
  } = options;

  return useQuery({
    queryKey: [
      "unified-supplier-labels",
      products?.map(p => p.id).join(','),
      useMasterBarcode,
      includePrice,
      includeCategory
    ],
    queryFn: async (): Promise<ThermalLabelData[]> => {
      if (!products || products.length === 0) {
        logger.warn('No products provided for supplier label generation', {}, 'useUnifiedSupplierLabels');
        return [];
      }

      logger.info('Generating unified supplier thermal labels', {
        productCount: products.length,
        useMasterBarcode,
        includePrice,
        includeCategory
      }, 'useUnifiedSupplierLabels');

      const labels: ThermalLabelData[] = [];

      for (const product of products) {
        try {
          // Check if product has serialized units
          if (product.units && product.units.length > 0) {
            // Generate labels for each unit
            for (const unit of product.units) {
              // Use unit barcode or generate one if missing
              let barcode = unit.barcode;
              
              if (!barcode && !useMasterBarcode) {
                try {
                  // Generate barcode using UniversalBarcodeService
                  const barcodeResult = await universalBarcodeService.generateBarcodesForUnits(
                    product.id,
                    [{ 
                      serial: unit.serial_number,
                      price: unit.price,
                      min_price: unit.min_price,
                      max_price: unit.max_price,
                      storage: unit.storage,
                      ram: unit.ram,
                      color: unit.color,
                      battery_level: unit.battery_level
                    }],
                    'supplier'
                  );
                  
                  if (barcodeResult.success && barcodeResult.barcodes.length > 0) {
                    barcode = barcodeResult.barcodes[0].barcode;
                  }
                } catch (error) {
                  logger.error('Failed to generate barcode for supplier unit', error, 'useUnifiedSupplierLabels');
                  // Use fallback barcode format
                  barcode = `SUPP-${product.id.slice(-8)}-${unit.serial_number}`;
                }
              } else if (useMasterBarcode && product.barcode) {
                barcode = product.barcode;
              }

              // Create thermal label data
              const label: ThermalLabelData = {
                productName: `${product.brand} ${product.model}`,
                serialNumber: unit.serial_number,
                barcode: barcode || `TEMP-${Date.now()}`,
                price: includePrice ? (unit.price ?? product.price) : product.price,
                maxPrice: unit.max_price,
                minPrice: unit.min_price,
                category: includeCategory ? product.category?.name : undefined,
                color: unit.color,
                batteryLevel: unit.battery_level,
                storage: unit.storage,
                ram: unit.ram
              };

              // DEBUG: Log price data flow for supplier labels
              logger.debug('Created supplier label data', {
                productName: label.productName,
                serialNumber: label.serialNumber,
                unit_price: unit.price,
                unit_max_price: unit.max_price,
                label_price: label.price,
                label_maxPrice: label.maxPrice,
                includePrice
              }, 'useUnifiedSupplierLabels');

              labels.push(label);
            }
          } else {
            // Non-serialized product - create single label
            const label: ThermalLabelData = {
              productName: `${product.brand} ${product.model}`,
              barcode: product.barcode || `PROD-${product.id.slice(-8)}`,
              price: product.price,
              category: includeCategory ? product.category?.name : undefined
            };

            labels.push(label);
          }
        } catch (error) {
          logger.error('Failed to process product for supplier labels', {
            productId: product.id,
            brand: product.brand,
            model: product.model,
            error
          }, 'useUnifiedSupplierLabels');
        }
      }

      logger.info('Successfully generated unified supplier thermal labels', {
        totalLabels: labels.length,
        productsProcessed: products.length
      }, 'useUnifiedSupplierLabels');

      return labels;
    },
    enabled: products && products.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });
}