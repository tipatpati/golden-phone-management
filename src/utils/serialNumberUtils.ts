// Simplified serial number utilities - removed concatenation/parsing
export interface SerialWithBattery {
  serial: string;
  batteryLevel?: number;
  color?: string;
  storage?: number;
  ram?: number;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Simple validation for individual serial numbers
 */
export function validateSerialNumber(serial: string): { isValid: boolean; error?: string } {
  const trimmed = serial.trim();
  if (!trimmed) {
    return { isValid: false, error: "Serial number cannot be empty" };
  }

  // Check if it's a potential IMEI (15 digits)
  const numericOnly = trimmed.replace(/\D/g, '');
  if (numericOnly.length === 15) {
    if (!/^\d{15}$/.test(numericOnly)) {
      return { isValid: false, error: "IMEI must be exactly 15 digits" };
    }
  } else if (!/^[A-Za-z0-9]+$/.test(trimmed)) {
    return { isValid: false, error: "Serial number must contain only letters and numbers" };
  } else if (trimmed.length < 3) {
    return { isValid: false, error: "Serial number must be at least 3 characters long" };
  }
  
  return { isValid: true };
}

// DEPRECATED: These functions are no longer used in the new thermal label system
// They are kept for backward compatibility with existing code
export function parseSerialWithBattery(serialString: string): SerialWithBattery {
  console.warn('⚠️ parseSerialWithBattery is deprecated - use ThermalLabelDataService instead');
  return { serial: serialString.trim() };
}

export function validateSerialWithBattery(serialString: string): { isValid: boolean; error?: string } {
  console.warn('⚠️ validateSerialWithBattery is deprecated - use LabelDataValidator instead');
  return validateSerialNumber(serialString);
}