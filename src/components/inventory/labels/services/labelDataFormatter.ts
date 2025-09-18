import type { ThermalLabelData, ThermalLabelOptions } from "@/services/labels/types";
import { logger } from "@/utils/logger";

/**
 * Phase 3: Enhanced Label Data Formatter
 * Ensures perfect consistency between preview and print components
 * Centralizes all formatting logic with improved type safety
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
 * Enhanced with better type handling and formatting consistency
 */
export function formatLabelElements(
  label: ThermalLabelData,
  options: ThermalLabelOptions & { companyName?: string }
): FormattedLabelElements {
  logger.debug('formatLabelElements input', { label, options }, 'labelDataFormatter');
  
  // Enhanced product name formatting
  const productName = formatProductName(label.productName);
  
  // Enhanced price logic - prioritize maxPrice for thermal labels
  const displayPrice = label.maxPrice || label.price;
  
  const formatted = {
    productName,
    serialNumber: label.serialNumber ? formatSerialNumber(label.serialNumber) : null,
    price: options.includePrice && typeof displayPrice === 'number' ? formatPrice(displayPrice) : null,
    maxPrice: label.maxPrice && typeof label.maxPrice === 'number' ? formatPrice(label.maxPrice) : null,
    companyName: options.includeCompany && options.companyName?.trim() ? formatCompanyName(options.companyName) : null,
    category: options.includeCategory && label.category?.trim() ? label.category : null,
    barcode: options.includeBarcode && label.barcode?.trim() ? label.barcode : null,
    storage: formatStorage(label.storage),
    ram: formatRAM(label.ram),
    batteryLevel: formatBatteryLevel(label.batteryLevel)
  };
  
  logger.debug('formatLabelElements output', {
    formatted,
    inputDebug: {
      originalStorage: label.storage,
      originalRam: label.ram,
      originalBatteryLevel: label.batteryLevel,
      formattedStorage: formatted.storage,
      formattedRam: formatted.ram,
      formattedBatteryLevel: formatted.batteryLevel
    }
  }, 'labelDataFormatter');
  
  return formatted;
}

/**
 * Enhanced formatting functions for consistent output
 */

function formatProductName(productName: string): string {
  if (!productName) return '';
  return productName
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .substring(0, 50);
}

function formatSerialNumber(serialNumber: string): string {
  return `SN: ${serialNumber.trim()}`;
}

function formatCompanyName(companyName: string): string {
  return companyName.trim().toUpperCase();
}

function formatPrice(price: number): string {
  return `€${price.toFixed(2)}`;
}

function formatStorage(storage: number | undefined): string | null {
  if (!storage || storage <= 0) return null;
  return `${storage}GB`;
}

function formatRAM(ram: number | undefined): string | null {
  if (!ram || ram <= 0) return null;
  return `${ram}GB RAM`;
}

function formatBatteryLevel(batteryLevel: number | undefined): string | null {
  if (batteryLevel === undefined || batteryLevel === null || batteryLevel <= 0) return null;
  return `${Math.round(batteryLevel)}%`;
}

/**
 * Phase 4: Enhanced barcode utilities (deprecated - use BarcodeRenderer instead)
 */
export function detectBarcodeFormat(barcode: string): string {
  // Always use CODE128 for thermal labels
  return 'CODE128';
}

/**
 * @deprecated Use BARCODE_CONFIG from config.ts and BarcodeRenderer instead
 */
export function getBarcodeConfig() {
  console.warn('getBarcodeConfig is deprecated. Use BARCODE_CONFIG from config.ts');
  return {
    width: 1.8,
    height: 36,
    displayValue: true,
    fontSize: 8,
    font: 'Arial',
    textAlign: 'center' as const,
    textPosition: 'bottom' as const,
    margin: 4,
    background: '#ffffff',
    lineColor: '#000000'
  };
}