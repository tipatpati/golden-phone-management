export interface SerialWithBattery {
  serial: string;
  batteryLevel?: number;
  color?: string;
  storage?: number; // in GB, e.g., 64, 128, 256
  ram?: number; // in GB, e.g., 4, 6, 8, 12, 16
}

/**
 * Parses a serial number string with battery level and color
 * Format: "SERIAL_NUMBER BATTERY_LEVEL COLOR" or "SERIAL_NUMBER BATTERY_LEVEL" or just "SERIAL_NUMBER"
 */
export function parseSerialWithBattery(serialString: string): SerialWithBattery {
  const parts = serialString.trim().split(/\s+/);
  const STORAGE_SET = new Set([16, 32, 64, 128, 256, 512, 1024]);
  const RAM_SET = new Set([1, 2, 3, 4, 6, 8, 12, 16, 18, 24, 32]);

  if (parts.length === 0) {
    return { serial: '' };
  }

  const result: SerialWithBattery = { serial: parts[0] };
  const tokens = parts.slice(1);
  const colorTokens: string[] = [];

  for (const raw of tokens) {
    const token = raw.replace(/[%]/g, ''); // Remove % but keep GB for proper parsing
    const ramToken = raw.replace(/GB-RAM$/, ''); // Extract RAM values with GB-RAM suffix
    const storageToken = raw.replace(/[%GB]/g, ''); // Regular storage parsing
    
    const n = parseInt(token.replace(/GB.*/, ''));
    const ramValue = parseInt(ramToken);

    if (!isNaN(ramValue) && raw.includes('GB-RAM') && RAM_SET.has(ramValue) && result.ram === undefined) {
      result.ram = ramValue;
      continue;
    }
    
    if (!isNaN(n)) {
      if (n >= 0 && n <= 100 && result.batteryLevel === undefined) {
        result.batteryLevel = n;
        continue;
      }
      if (STORAGE_SET.has(n) && raw.includes('GB') && !raw.includes('GB-RAM') && result.storage === undefined) {
        result.storage = n;
        continue;
      }
      // numeric token that is not battery, storage, or RAM -> treat as color part to be lenient
      colorTokens.push(raw);
    } else {
      colorTokens.push(raw);
    }
  }

  if (colorTokens.length > 0) {
    result.color = colorTokens.join(' ');
  }

  return result;
}

/**
 * Formats a serial number with battery level and color
 */
export function formatSerialWithBattery(
  serial: string,
  batteryLevel?: number,
  color?: string,
  storage?: number,
  ram?: number
): string {
  let result = serial;
  
  if (color?.trim()) {
    result += ` ${color}`;
  }
  
  if (storage !== undefined && storage > 0) {
    result += ` ${storage}GB`;
  }
  
  if (ram !== undefined && ram > 0) {
    result += ` ${ram}GB-RAM`;
  }
  
  if (batteryLevel !== undefined && batteryLevel > 0) {
    result += ` ${batteryLevel}%`;
  }
  
  return result;
}

/**
 * Validates a serial number with battery level and color format
 */
export function validateSerialWithBattery(serialString: string): { isValid: boolean; error?: string } {
  const trimmed = serialString.trim();
  if (!trimmed) {
    return { isValid: false, error: "Serial number cannot be empty" };
  }

  const parts = trimmed.split(/\s+/);
  const firstPart = parts[0];
  
  // Check if it's a potential IMEI (15 digits)
  const numericOnly = firstPart.replace(/\D/g, '');
  if (numericOnly.length === 15) {
    // IMEI validation - basic length check (full Luhn validation done in imeiValidation.ts)
    if (!/^\d{15}$/.test(numericOnly)) {
      return { isValid: false, error: "IMEI must be exactly 15 digits" };
    }
  } else if (!/^[A-Za-z0-9]+$/.test(firstPart)) {
    return { isValid: false, error: "Serial number must contain only letters and numbers" };
  } else if (firstPart.length < 3) {
    return { isValid: false, error: "Serial number must be at least 3 characters long" };
  }
  
  if (parts.length === 1) {
    // Just serial number, that's fine
    return { isValid: true };
  }
  
  if (parts.length === 2) {
    // Could be SERIAL COLOR or SERIAL BATTERY
    const secondPart = parts[1];
    const batteryLevel = parseInt(secondPart);
    
    // If it's a number, treat as battery level
    if (!isNaN(batteryLevel)) {
      if (batteryLevel < 0 || batteryLevel > 100) {
        return { isValid: false, error: "Battery level must be between 0 and 100" };
      }
    }
    // If it's not a number, treat as color - both are valid
    return { isValid: true };
  }
  
  if (parts.length === 3) {
    // Format could be: SERIAL COLOR BATTERY or SERIAL BATTERY COLOR
    const secondPart = parts[1];
    const thirdPart = parts[2];
    
    const secondPartNum = parseInt(secondPart);
    const thirdPartNum = parseInt(thirdPart);
    
    // Check if either the second or third part is a valid battery level
    let hasBatteryLevel = false;
    
    if (!isNaN(secondPartNum) && secondPartNum >= 0 && secondPartNum <= 100) {
      hasBatteryLevel = true;
    }
    
    if (!isNaN(thirdPartNum) && thirdPartNum >= 0 && thirdPartNum <= 100) {
      hasBatteryLevel = true;
    }
    
    // If we found a number but it's not a valid battery level, return error
    if (!hasBatteryLevel && (!isNaN(secondPartNum) || !isNaN(thirdPartNum))) {
      const invalidNum = !isNaN(secondPartNum) ? secondPartNum : thirdPartNum;
      if (invalidNum < 0 || invalidNum > 100) {
        return { isValid: false, error: "Battery level must be between 0 and 100" };
      }
    }
    
    return { isValid: true };
  }
  
  return { isValid: true };
}