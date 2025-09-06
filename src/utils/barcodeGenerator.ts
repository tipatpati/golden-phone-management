// DEPRECATED: Legacy barcode generation utilities
// New CODE128 system available in src/services/barcodes/
import { Code128GeneratorService } from '@/services/barcodes';
import { formatProductName, parseSerialString } from "./productNaming";
import { validateIMEI } from './imeiValidation';

export interface BarcodeOptions {
  format?: string;
  batteryLevel?: number;
  color?: string;
  productId?: string;
}

export interface BarcodeResult {
  barcode: string;
  format: string;
  isGS1Compliant?: boolean;
  metadata?: any;
}

/**
 * DEPRECATED: Use Code128GeneratorService.validateCode128() instead
 * Calculate the check digit for EAN13 barcode
 */
export function calculateEAN13CheckDigit(partialBarcode: string): string {
  console.warn('⚠️ calculateEAN13CheckDigit is deprecated. Use Code128GeneratorService instead.');
  if (partialBarcode.length !== 12) {
    throw new Error('Partial barcode must be exactly 12 digits');
  }

  let oddSum = 0;
  let evenSum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(partialBarcode[i]);
    if (i % 2 === 0) {
      oddSum += digit;
    } else {
      evenSum += digit;
    }
  }

  const total = oddSum + (evenSum * 3);
  const checkDigit = (10 - (total % 10)) % 10;
  
  return checkDigit.toString();
}

/**
 * DEPRECATED: Use Code128GeneratorService.validateCode128() instead
 * Validate EAN13 barcode format and check digit
 */
export function validateEAN13Barcode(barcode: string): boolean {
  console.warn('⚠️ validateEAN13Barcode is deprecated. Use Code128GeneratorService instead.');
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }

  const partialBarcode = barcode.slice(0, 12);
  const providedCheckDigit = barcode.slice(12);
  const calculatedCheckDigit = calculateEAN13CheckDigit(partialBarcode);

  return providedCheckDigit === calculatedCheckDigit;
}

/**
 * DEPRECATED: Use Code128GeneratorService.generateUnitBarcode() instead
 * Generate a valid EAN13 barcode from a 12-digit prefix
 */
export function generateValidEAN13Barcode(prefix: string = "123456789012"): string {
  console.warn('⚠️ generateValidEAN13Barcode is deprecated. Use Code128GeneratorService instead.');
  if (prefix.length !== 12 || !/^\d{12}$/.test(prefix)) {
    throw new Error('Prefix must be exactly 12 digits');
  }

  const checkDigit = calculateEAN13CheckDigit(prefix);
  return prefix + checkDigit;
}

/**
 * DEPRECATED: Use Code128GeneratorService instead
 * Generate barcode from string input
 */
export function generateFromString(input: string): string {
  console.warn('⚠️ generateFromString is deprecated. Use Code128GeneratorService instead.');
  return input.replace(/[^\w-]/g, '').toUpperCase();
}

/**
 * DEPRECATED: Use Code128GeneratorService.generateUnitBarcode() instead
 * Generate IMEI barcode
 */
export function generateIMEIBarcode(imei: string, options: BarcodeOptions = { format: 'AUTO' }): BarcodeResult {
  console.warn('⚠️ generateIMEIBarcode is deprecated. Use Code128GeneratorService instead.');
  return {
    barcode: imei.replace(/[^\w-]/g, '').toUpperCase(),
    format: 'CODE128'
  };
}

/**
 * DEPRECATED: Use Code128GeneratorService.generateUnitBarcode() instead
 */
export function generateLegacySerialBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  console.warn('⚠️ generateLegacySerialBarcode is deprecated. Use Code128GeneratorService instead.');
  return serial.replace(/[^\w-]/g, '').toUpperCase();
}

/**
 * DEPRECATED: Use Code128GeneratorService.generateUnitBarcode() instead
 */
export function generateSerialBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  console.warn('⚠️ generateSerialBasedBarcode is deprecated. Use Code128GeneratorService instead.');
  return serial.replace(/[^\w-]/g, '').toUpperCase();
}

/**
 * DEPRECATED: Use Code128GeneratorService.generateUnitBarcode() instead
 */
export function generateProductBarcode(brand: string, model: string, serialNumbers?: string[], unitIndex: number = 0, hasSerial: boolean = true): string {
  console.warn('⚠️ generateProductBarcode is deprecated. Use Code128GeneratorService instead.');
  if (hasSerial && serialNumbers && serialNumbers.length > unitIndex) {
    const serial = serialNumbers[unitIndex];
    return serial.replace(/[^\w-]/g, '').toUpperCase();
  } else {
    const productName = `${brand} ${model}`;
    return productName.replace(/[^\w-]/g, '').toUpperCase();
  }
}

/**
 * DEPRECATED: Use Code128GeneratorService.generateUnitBarcode() instead
 * Generate SKU-based barcode with hash for uniqueness
 */
export function generateSKUBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  console.warn('⚠️ generateSKUBasedBarcode is deprecated. Use Code128GeneratorService instead.');
  return serial.replace(/[^\w-]/g, '').toUpperCase();
}