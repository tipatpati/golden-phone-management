import { ThermalLabelData, ThermalLabelOptions } from "../types";

/**
 * Centralized label data formatting to ensure consistency between preview and print
 * This ensures that both the preview component and the print template use identical formatting
 */
export interface FormattedLabelElements {
  productName: string;
  serialNumber: string | null;
  price: string | null;
  maxPrice: string | null;
  companyName: string | null;
  category: string | null;
  barcode: string | null;
  storage: string | null;
  ram: string | null;
  batteryLevel: string | null;
}

/**
 * Format label data consistently for both preview and print
 */
export function formatLabelElements(
  label: ThermalLabelData,
  options: ThermalLabelOptions & { companyName?: string }
): FormattedLabelElements {
  // Debug log to see what data we're working with
  console.log('🏷️ formatLabelElements input:', { label, options });
  
  // Price logic: Use max price if available, otherwise fall back to unit price
  const displayPrice = label.maxPrice || label.price;
  
  const formatted = {
    productName: label.productName || '',
    serialNumber: label.serialNumber ? `SN: ${label.serialNumber}` : null,
    price: options.includePrice && typeof displayPrice === 'number' ? `€${displayPrice.toFixed(2)}` : null,
    maxPrice: label.maxPrice && typeof label.maxPrice === 'number' ? `€${label.maxPrice.toFixed(2)}` : null,
    companyName: options.includeCompany && options.companyName?.trim() ? options.companyName : null,
    category: options.includeCategory && label.category?.trim() ? label.category : null,
    barcode: options.includeBarcode && label.barcode?.trim() ? label.barcode : null,
    storage: label.storage && label.storage > 0 ? `${label.storage}GB` : null,
    ram: label.ram && label.ram > 0 ? `${label.ram}GB RAM` : null,
    batteryLevel: label.batteryLevel && label.batteryLevel > 0 ? `${label.batteryLevel}%` : null
  };
  
  // Debug log to see what data we're outputting
  console.log('🏷️ formatLabelElements output:', formatted);
  console.log('🏷️ Storage/RAM/Battery debug:', {
    originalStorage: label.storage,
    originalRam: label.ram,
    originalBatteryLevel: label.batteryLevel,
    formattedStorage: formatted.storage,
    formattedRam: formatted.ram,
    formattedBatteryLevel: formatted.batteryLevel,
    storageCondition: label.storage && label.storage > 0,
    ramCondition: label.ram && label.ram > 0,
    batteryCondition: label.batteryLevel && label.batteryLevel > 0
  });
  
  return formatted;
}

/**
 * Detect barcode format consistently across preview and print
 */
export function detectBarcodeFormat(barcode: string): string {
  // Always use CODE128 to avoid EAN13 validation issues
  return 'CODE128';
}

/**
 * Generate barcode configuration for consistent rendering
 */
export function getBarcodeConfig() {
  return {
    width: 2.2,
    height: 65,
    displayValue: true,
    fontSize: 12,
    font: 'Arial',
    textAlign: 'center' as const,
    textPosition: 'bottom' as const,
    margin: 2,
    background: '#ffffff',
    lineColor: '#000000'
  };
}