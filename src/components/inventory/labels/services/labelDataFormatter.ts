import { ThermalLabelData, ThermalLabelOptions } from "../types";

/**
 * Centralized label data formatting to ensure consistency between preview and print
 * This ensures that both the preview component and the print template use identical formatting
 */
export interface FormattedLabelElements {
  productName: string;
  serialNumber: string | null;
  price: string | null;
  companyName: string | null;
  category: string | null;
  barcode: string | null;
  storage: string | null;
  ram: string | null;
}

/**
 * Format label data consistently for both preview and print
 */
export function formatLabelElements(
  label: ThermalLabelData,
  options: ThermalLabelOptions & { companyName?: string }
): FormattedLabelElements {
  return {
    productName: label.productName || '',
    serialNumber: label.serialNumber ? `SN: ${label.serialNumber}` : null,
    price: options.includePrice && typeof label.price === 'number' ? `€${label.price.toFixed(2)}` : null,
    companyName: options.includeCompany && options.companyName?.trim() ? options.companyName : null,
    category: options.includeCategory && label.category?.trim() ? label.category : null,
    barcode: options.includeBarcode && label.barcode?.trim() ? label.barcode : null,
    storage: label.storage ? `${label.storage}GB` : null,
    ram: label.ram ? `${label.ram}GB RAM` : null
  };
}

/**
 * Detect barcode format consistently across preview and print
 */
export function detectBarcodeFormat(barcode: string): string {
  if (/^\d{13}$/.test(barcode)) {
    return 'EAN13';
  }
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