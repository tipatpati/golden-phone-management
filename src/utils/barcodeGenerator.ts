// Enhanced barcode generation with GS1 compliance and IMEI support

import { validateIMEI } from './imeiValidation';
import { generateOptimalBarcode, BarcodeGenerationOptions, BarcodeResult } from './gs1BarcodeGenerator';

export interface BarcodeOptions extends BarcodeGenerationOptions {
  batteryLevel?: number;
  color?: string;
  productId?: string;
}

/**
 * Legacy EAN13 check digit calculation (kept for backward compatibility)
 */
function calculateEAN13CheckDigit(partialBarcode: string): string {
  let sum = 0;
  
  for (let i = 0; i < partialBarcode.length; i++) {
    const digit = parseInt(partialBarcode[i]);
    const multiplier = (i % 2 === 0) ? 1 : 3;
    sum += digit * multiplier;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Validates EAN13 barcode format and check digit
 */
export function validateEAN13Barcode(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }
  
  const checkDigit = barcode.slice(-1);
  const partialBarcode = barcode.slice(0, -1);
  const calculatedCheckDigit = calculateEAN13CheckDigit(partialBarcode);
  
  return checkDigit === calculatedCheckDigit;
}

/**
 * Generates a valid EAN13 barcode (legacy function)
 */
export function generateValidEAN13Barcode(prefix: string = "123456789012"): string {
  const sanitizedPrefix = prefix.replace(/[^0-9]/g, '').slice(0, 12);
  const paddedPrefix = sanitizedPrefix.padEnd(12, '0');
  
  const checkDigit = calculateEAN13CheckDigit(paddedPrefix);
  return paddedPrefix + checkDigit;
}

/**
 * Enhanced IMEI-based barcode generation with GS1 compliance
 */
export function generateIMEIBarcode(imei: string, options: BarcodeOptions = { format: 'AUTO' }): BarcodeResult {
  // Validate IMEI first
  const imeiValidation = validateIMEI(imei);
  
  if (!imeiValidation.isValid) {
    // If IMEI is invalid, fall back to legacy generation
    return {
      barcode: generateLegacySerialBarcode(imei, options.productId, options.batteryLevel),
      format: 'CODE128',
      isGS1Compliant: false,
      metadata: {}
    };
  }
  
  // Use GS1-compliant generation for valid IMEI
  const gs1Options: BarcodeGenerationOptions = {
    ...options,
    deviceType: 'mobile',
    applicationIdentifiers: {
      '01': '', // Will be filled by GS1 generator
      '21': imeiValidation.formattedIMEI!, // Serial number
      ...(options.batteryLevel && { '90': options.batteryLevel.toString() }) // Custom AI for battery
    }
  };
  
  return generateOptimalBarcode(imeiValidation.formattedIMEI!, gs1Options);
}

/**
 * Legacy serial-based barcode generation (for backward compatibility)
 */
function generateLegacySerialBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  const cleanSerial = serial.replace(/[^A-Za-z0-9]/g, '');
  const numericSerial = cleanSerial.replace(/[^0-9]/g, '');
  
  // If we have enough digits, try to create EAN13
  if (numericSerial.length >= 8) {
    const prefix = numericSerial.slice(0, 12).padEnd(12, '0');
    return generateValidEAN13Barcode(prefix);
  }
  
  // Otherwise, use alphanumeric format for CODE128
  const batteryCode = batteryLevel !== undefined ? batteryLevel.toString() : '0';
  return cleanSerial + batteryCode;
}

/**
 * Main function for generating barcodes from serial numbers/IMEI
 */
export function generateSerialBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  const options: BarcodeOptions = {
    format: 'AUTO',
    productId,
    batteryLevel
  };
  
  const result = generateIMEIBarcode(serial, options);
  return result.barcode;
}

/**
 * Legacy function name for backward compatibility
 */
export function generateSKUBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  return generateSerialBasedBarcode(serial, productId, batteryLevel);
}