// Barcode generation utility
export function generateUniqueBarcode(): string {
  // Generate a 13-digit EAN-13 barcode
  // Format: Country code (3) + Manufacturer (4) + Product (5) + Check digit (1)
  
  // Use a fixed country code for internal products (e.g., 123 for internal use)
  const countryCode = "123";
  
  // Generate manufacturer code (4 digits)
  const manufacturerCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Generate product code (5 digits)
  const productCode = Math.floor(10000 + Math.random() * 90000).toString();
  
  // Calculate check digit using EAN-13 algorithm
  const partialBarcode = countryCode + manufacturerCode + productCode;
  const checkDigit = calculateEAN13CheckDigit(partialBarcode);
  
  return partialBarcode + checkDigit;
}

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

export function generateSerialBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  // Create a more deterministic barcode based on serial/IMEI + battery state
  const baseNumber = serial.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Convert serial to numeric representation
  let numericSerial = '';
  for (let i = 0; i < baseNumber.length && numericSerial.length < 6; i++) {
    const char = baseNumber[i];
    if (/\d/.test(char)) {
      numericSerial += char;
    } else {
      // Convert letter to number (A=01, B=02, etc.)
      const charCode = char.charCodeAt(0) - 64; // A=1, B=2, etc.
      numericSerial += charCode.toString().padStart(2, '0');
    }
  }
  
  // Pad or truncate to exactly 6 digits for serial part
  if (numericSerial.length < 6) {
    numericSerial = numericSerial.padEnd(6, '0');
  } else if (numericSerial.length > 6) {
    numericSerial = numericSerial.substring(0, 6);
  }
  
  // Incorporate battery level (0-100) as 2-digit code, or use 99 as default
  const batteryCode = batteryLevel !== undefined 
    ? Math.max(0, Math.min(100, Math.round(batteryLevel))).toString().padStart(2, '0')
    : '99';
  
  // Create 12-digit code: Country(3) + Serial(6) + Battery(2) + Random(1)
  const randomDigit = Math.floor(Math.random() * 10).toString();
  const partialBarcode = "123" + numericSerial + batteryCode + randomDigit;
  
  const checkDigit = calculateEAN13CheckDigit(partialBarcode);
  return partialBarcode + checkDigit;
}

// Legacy function name for backward compatibility - now uses serial/IMEI + battery state
export function generateSKUBasedBarcode(serial: string, productId?: string, batteryLevel?: number): string {
  return generateSerialBasedBarcode(serial, productId, batteryLevel);
}