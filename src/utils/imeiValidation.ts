// IMEI validation utilities following ITU-T standards

export interface IMEIValidationResult {
  isValid: boolean;
  error?: string;
  formattedIMEI?: string;
  deviceInfo?: {
    tac: string; // Type Allocation Code (first 8 digits)
    snr: string; // Serial Number (next 6 digits)
    cd: string;  // Check Digit (last digit)
  };
}

/**
 * Validates IMEI using Luhn algorithm as per ITU-T standards
 */
export function validateIMEI(imei: string): IMEIValidationResult {
  // Remove any non-digit characters
  const cleanIMEI = imei.replace(/\D/g, '');
  
  // IMEI must be exactly 15 digits
  if (cleanIMEI.length !== 15) {
    return {
      isValid: false,
      error: 'IMEI must be exactly 15 digits'
    };
  }

  // Validate using Luhn algorithm
  const digits = cleanIMEI.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 14; i++) {
    let digit = digits[i];
    
    // Double every second digit from right (starting from position 1)
    if ((14 - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit = digit - 9;
      }
    }
    
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  const providedCheckDigit = digits[14];
  
  if (checkDigit !== providedCheckDigit) {
    return {
      isValid: false,
      error: 'Invalid IMEI check digit'
    };
  }

  return {
    isValid: true,
    formattedIMEI: cleanIMEI,
    deviceInfo: {
      tac: cleanIMEI.substring(0, 8),
      snr: cleanIMEI.substring(8, 14),
      cd: cleanIMEI.substring(14, 15)
    }
  };
}

/**
 * Formats IMEI with standard separators
 */
export function formatIMEI(imei: string): string {
  const clean = imei.replace(/\D/g, '');
  if (clean.length !== 15) return imei;
  
  return `${clean.substring(0, 2)}-${clean.substring(2, 8)}-${clean.substring(8, 14)}-${clean.substring(14)}`;
}

/**
 * Generates a valid IMEI check digit for testing purposes
 */
export function generateIMEICheckDigit(partialIMEI: string): string {
  const clean = partialIMEI.replace(/\D/g, '').substring(0, 14);
  if (clean.length !== 14) {
    throw new Error('Partial IMEI must be exactly 14 digits');
  }
  
  const digits = clean.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 14; i++) {
    let digit = digits[i];
    
    if ((14 - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit = digit - 9;
      }
    }
    
    sum += digit;
  }
  
  return ((10 - (sum % 10)) % 10).toString();
}