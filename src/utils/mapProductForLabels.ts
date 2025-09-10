/**
 * Product Data Mapping for Thermal Labels
 * Standardizes product data transformation for label generation
 * Uses "units" as primary data source with "serial_numbers" compatibility
 */

import type { ProductForLabels } from "@/services/labels/types";

interface ProductWithUnits {
  id: string;
  brand: string;
  model: string;
  price?: number;
  min_price?: number;
  max_price?: number;
  stock?: number;
  barcode?: string;
  category?: { name: string };
  year?: number;
  storage?: number;
  ram?: number;
  has_serial?: boolean;
  // Primary data source
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
    status?: string;
  }>;
  // Legacy compatibility
  serial_numbers?: string[];
}

/**
 * Maps any product structure to ProductForLabels with standardized data
 * Uses units as primary source, extracts serial_numbers for compatibility
 */
export function mapProductForLabels(product: ProductWithUnits): ProductForLabels {
  console.log(`🔄 Mapping product for labels: ${product.brand} ${product.model}`);
  
  // Extract serial numbers from units (primary source)
  let serialNumbers: string[] = [];
  
  if (product.units && product.units.length > 0) {
    serialNumbers = product.units
      .filter(unit => unit.serial_number && unit.status !== 'sold')
      .map(unit => unit.serial_number);
    console.log(`✅ Extracted ${serialNumbers.length} serial numbers from units`);
  } else if (product.serial_numbers && product.serial_numbers.length > 0) {
    // Fallback to legacy serial_numbers field
    serialNumbers = product.serial_numbers;
    console.log(`⚠️ Using legacy serial_numbers field: ${serialNumbers.length} serials`);
  }

  const mappedProduct: ProductForLabels = {
    id: product.id,
    brand: product.brand,
    model: product.model,
    price: product.price,
    min_price: product.min_price,
    max_price: product.max_price,
    stock: product.stock,
    barcode: product.barcode,
    category: product.category,
    year: product.year,
    storage: product.storage,
    ram: product.ram,
    // Always provide serial_numbers for ThermalLabelDataService compatibility
    serial_numbers: serialNumbers
  };

  console.log(`📋 Mapped product:`, {
    id: mappedProduct.id,
    serialCount: mappedProduct.serial_numbers?.length || 0,
    hasUnits: !!(product.units && product.units.length > 0),
    hasLegacySerials: !!(product.serial_numbers && product.serial_numbers.length > 0)
  });

  return mappedProduct;
}

/**
 * Maps an array of products to ProductForLabels format
 */
export function mapProductsForLabels(products: ProductWithUnits[]): ProductForLabels[] {
  console.log(`🔄 Mapping ${products.length} products for labels`);
  
  return products.map(mapProductForLabels);
}