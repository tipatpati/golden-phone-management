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

export function generateSKUBasedBarcode(sku: string, productId?: string): string {
  // Create a more deterministic barcode based on SKU
  const baseNumber = sku.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // Convert SKU to numeric representation
  let numericSku = '';
  for (let i = 0; i < baseNumber.length && numericSku.length < 8; i++) {
    const char = baseNumber[i];
    if (/\d/.test(char)) {
      numericSku += char;
    } else {
      // Convert letter to number (A=01, B=02, etc.)
      const charCode = char.charCodeAt(0) - 64; // A=1, B=2, etc.
      numericSku += charCode.toString().padStart(2, '0');
    }
  }
  
  // Pad or truncate to exactly 8 digits
  if (numericSku.length < 8) {
    numericSku = numericSku.padEnd(8, '0');
  } else if (numericSku.length > 8) {
    numericSku = numericSku.substring(0, 8);
  }
  
  // Add timestamp-based suffix to ensure uniqueness
  const timestamp = Date.now().toString().slice(-4);
  const partialBarcode = "123" + numericSku + timestamp; // Total 12 digits
  
  const checkDigit = calculateEAN13CheckDigit(partialBarcode);
  return partialBarcode + checkDigit;
}