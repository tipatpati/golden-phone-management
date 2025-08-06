// Barcode generation utility

function calculateEAN13CheckDigit(partialBarcode: string): string {
  let sum = 0;
  
  for (let i = 0; i < partialBarcode.length; i++) {
    const digit = parseInt(partialBarcode[i]);
    // Multiply by 1 for odd positions, 3 for even positions (1-indexed)
    const multiplier = (i % 2 === 0) ? 1 : 3;
    sum += digit * multiplier;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

export function validateEAN13Barcode(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }
  
  const checkDigit = barcode.slice(-1);
  const partialBarcode = barcode.slice(0, -1);
  const calculatedCheckDigit = calculateEAN13CheckDigit(partialBarcode);
  
  return checkDigit === calculatedCheckDigit;
}

export function generateValidEAN13Barcode(prefix: string = "123456789012"): string {
  // Ensure we have 12 digits for the prefix
  const sanitizedPrefix = prefix.replace(/[^0-9]/g, '').slice(0, 12);
  const paddedPrefix = sanitizedPrefix.padEnd(12, '0');
  
  // Calculate and append check digit
  const checkDigit = calculateEAN13CheckDigit(paddedPrefix);
  return paddedPrefix + checkDigit;
}

export function generateSerialBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  // Try to generate a valid EAN13 barcode first
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

// Legacy function name for backward compatibility - now uses serial/IMEI + battery state
export function generateSKUBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  return generateSerialBasedBarcode(serial, productId, batteryLevel);
}