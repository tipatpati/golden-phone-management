// GS1-compliant barcode generation utilities

export interface GS1Configuration {
  companyPrefix: string; // GS1 Company Prefix (3-12 digits)
  itemReference?: string; // Item reference number
  checkDigit?: string; // GTIN check digit
}

export interface BarcodeGenerationOptions {
  format: 'GTIN-13' | 'CODE128' | 'AUTO';
  gs1Config?: GS1Configuration;
  applicationIdentifiers?: Record<string, string>; // GS1 Application Identifiers
  deviceType?: 'mobile' | 'product' | 'component';
}

export interface BarcodeResult {
  barcode: string;
  format: 'GTIN-13' | 'CODE128';
  isGS1Compliant: boolean;
  metadata: {
    companyPrefix?: string;
    itemReference?: string;
    checkDigit?: string;
    applicationIdentifiers?: Record<string, string>;
  };
}

/**
 * Default GS1 company prefix for demo/testing purposes
 * In production, this should be configured per company
 */
const DEFAULT_COMPANY_PREFIX = '123456789'; // 9-digit prefix

/**
 * Calculates GTIN-13 check digit using GS1 algorithm
 */
function calculateGTIN13CheckDigit(gtin12: string): string {
  const digits = gtin12.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    const multiplier = (i % 2 === 0) ? 1 : 3;
    sum += digits[i] * multiplier;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Generates GS1-compliant GTIN-13 from IMEI
 */
export function generateGTIN13FromIMEI(imei: string, options: BarcodeGenerationOptions = { format: 'AUTO' }): BarcodeResult {
  const cleanIMEI = imei.replace(/\D/g, '');
  const companyPrefix = options.gs1Config?.companyPrefix || DEFAULT_COMPANY_PREFIX;
  
  // For mobile devices, use a specific approach
  // Take last 8 digits of IMEI + company prefix to create 12-digit base
  const imeiSuffix = cleanIMEI.slice(-3); // Last 3 digits of IMEI
  const productCode = `${companyPrefix}${imeiSuffix}`.substring(0, 12);
  
  // Pad or trim to exactly 12 digits
  const gtin12 = productCode.padEnd(12, '0').substring(0, 12);
  const checkDigit = calculateGTIN13CheckDigit(gtin12);
  const gtin13 = gtin12 + checkDigit;
  
  return {
    barcode: gtin13,
    format: 'GTIN-13',
    isGS1Compliant: true,
    metadata: {
      companyPrefix,
      itemReference: imeiSuffix,
      checkDigit,
      applicationIdentifiers: options.applicationIdentifiers
    }
  };
}

/**
 * Generates CODE128 barcode with GS1 Application Identifiers
 */
export function generateCODE128WithGS1(imei: string, options: BarcodeGenerationOptions = { format: 'CODE128' }): BarcodeResult {
  const cleanIMEI = imei.replace(/\D/g, '');
  
  // Use GS1 Application Identifier (01) for GTIN and (21) for Serial Number
  let barcode = '';
  
  if (options.applicationIdentifiers) {
    // Build barcode with Application Identifiers
    Object.entries(options.applicationIdentifiers).forEach(([ai, value]) => {
      barcode += `(${ai})${value}`;
    });
  }
  
  // If no AIs provided, use IMEI directly
  if (!barcode) {
    barcode = cleanIMEI;
  }
  
  return {
    barcode,
    format: 'CODE128',
    isGS1Compliant: !!options.applicationIdentifiers,
    metadata: {
      applicationIdentifiers: options.applicationIdentifiers
    }
  };
}

/**
 * Auto-detects best barcode format for given input
 */
export function generateOptimalBarcode(imei: string, options: BarcodeGenerationOptions = { format: 'AUTO' }): BarcodeResult {
  const cleanIMEI = imei.replace(/\D/g, '');
  
  // If IMEI is valid (15 digits), prefer GTIN-13 for retail compatibility
  if (cleanIMEI.length === 15 && options.format !== 'CODE128') {
    return generateGTIN13FromIMEI(imei, options);
  }
  
  // Fallback to CODE128 for flexibility
  return generateCODE128WithGS1(imei, { ...options, format: 'CODE128' });
}

/**
 * Validates if a barcode is GS1 compliant
 */
export function validateGS1Compliance(barcode: string): boolean {
  // GTIN-13 validation
  if (/^\d{13}$/.test(barcode)) {
    const gtin12 = barcode.substring(0, 12);
    const checkDigit = barcode.substring(12, 13);
    const calculatedCheckDigit = calculateGTIN13CheckDigit(gtin12);
    return checkDigit === calculatedCheckDigit;
  }
  
  // CODE128 with GS1 AIs validation
  const gs1Pattern = /^\([0-9]{2,4}\).+/;
  return gs1Pattern.test(barcode);
}

/**
 * Extracts GS1 Application Identifiers from CODE128 barcode
 */
export function extractGS1ApplicationIdentifiers(barcode: string): Record<string, string> {
  const ais: Record<string, string> = {};
  const aiPattern = /\((\d{2,4})\)([^(]*)/g;
  let match;
  
  while ((match = aiPattern.exec(barcode)) !== null) {
    ais[match[1]] = match[2];
  }
  
  return ais;
}