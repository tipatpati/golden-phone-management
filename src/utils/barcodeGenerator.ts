// Enhanced barcode generation with GS1 compliance and IMEI support
import { formatProductName, parseSerialString } from "./productNaming";
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
 * Generates a string-based barcode using product naming convention
 */
function generateFromString(input: string): string {
  // Clean the input and create a numeric representation
  const cleanInput = input.replace(/[^A-Za-z0-9]/g, '');
  const numericInput = cleanInput.replace(/[^0-9]/g, '');
  
  // If we have enough digits, create EAN13
  if (numericInput.length >= 8) {
    const prefix = numericInput.slice(0, 12).padEnd(12, '0');
    return generateValidEAN13Barcode(prefix);
  }
  
  // Otherwise, use the clean input as is (CODE128 compatible)
  return cleanInput;
}

/**
 * Enhanced IMEI-based barcode generation with GS1 compliance
 */
export function generateIMEIBarcode(imei: string, options: BarcodeOptions = { format: 'AUTO' }): BarcodeResult {
  // Clean input
  const cleanInput = imei.replace(/[^A-Za-z0-9]/g, '');
  
  // Validate IMEI first
  const imeiValidation = validateIMEI(imei);
  
  if (imeiValidation.isValid) {
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
  } else {
    // For non-IMEI inputs, generate appropriate barcode format
    const numericOnly = cleanInput.replace(/[^0-9]/g, '');
    
    // If input has enough digits for EAN13, generate EAN13
    if (numericOnly.length >= 8 && options.format !== 'CODE128') {
      let base = numericOnly.slice(0, 12).padEnd(12, '0');
      if (options.productId) {
        // Inject a short numeric hash of productId to ensure uniqueness across products
        let h = 0;
        for (let i = 0; i < options.productId.length; i++) {
          h = (h * 31 + options.productId.charCodeAt(i)) >>> 0;
        }
        const h3 = (h % 1000).toString().padStart(3, '0');
        base = base.slice(0, 9) + h3; // keep first 9 digits from input, last 3 from hash
      }
      const ean13 = generateValidEAN13Barcode(base);
      
      return {
        barcode: ean13,
        format: 'GTIN-13',
        isGS1Compliant: true,
        metadata: { companyPrefix: base.slice(0, 9) }
      };
    } else {
      // Use CODE128 for alphanumeric or short inputs
      const batteryCode = options.batteryLevel !== undefined ? options.batteryLevel.toString() : '';
      let barcode = cleanInput + batteryCode;
      if (options.productId) {
        // Append short hash suffix for uniqueness when using CODE128
        let h = 0;
        for (let i = 0; i < options.productId.length; i++) {
          h = (h * 31 + options.productId.charCodeAt(i)) >>> 0;
        }
        const h3 = (h % 1000).toString().padStart(3, '0');
        barcode = `${barcode}-${h3}`;
      }
      
      return {
        barcode: barcode,
        format: 'CODE128',
        isGS1Compliant: false,
        metadata: {}
      };
    }
  }
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
 * Enhanced product barcode generation following Brand Model Storage convention
 */
export function generateProductBarcode(
  brand: string,
  model: string,
  serialNumbers?: string[],
  unitIndex: number = 0,
  hasSerial: boolean = true
): string {
  console.log('[Barcode] generateProductBarcode called', { 
    brand, 
    model, 
    serialCount: serialNumbers?.length, 
    unitIndex, 
    hasSerial 
  });

  // Generate barcode based on brand-model-storage format
  const productName = formatProductName({ brand, model });
  
  if (hasSerial && serialNumbers?.length > 0) {
    // Parse the first serial to get storage info for consistent naming
    const parsed = parseSerialString(serialNumbers[0]);
    const nameWithStorage = formatProductName({ brand, model, storage: parsed.storage });
    return generateFromString(nameWithStorage);
  }
  
  // For products without serials, use brand-model format
  return generateFromString(productName);
}

/**
 * Legacy function name for backward compatibility
 */
export function generateSKUBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  console.log('🔢 Generating unique barcode for:', { serial, productId, batteryLevel });
  
  // Create a unique hash from serial + productId + batteryLevel
  let uniqueString = serial;
  if (productId) uniqueString += productId;
  if (batteryLevel !== undefined) uniqueString += batteryLevel.toString();
  
  // Generate hash for uniqueness
  let hash = 0;
  for (let i = 0; i < uniqueString.length; i++) {
    hash = ((hash << 5) - hash + uniqueString.charCodeAt(i)) & 0xffffffff;
  }
  
  // Convert to positive number and create unique barcode
  const positiveHash = Math.abs(hash);
  const uniqueBarcode = `${serial.slice(-8)}${positiveHash.toString().slice(-4)}`;
  
  console.log('🔢 Generated unique barcode:', uniqueBarcode);
  return uniqueBarcode;
}
