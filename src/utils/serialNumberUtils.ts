export interface SerialWithBattery {
  serial: string;
  batteryLevel?: number;
  color?: string;
}

/**
 * Parses a serial number string with battery level and color
 * Format: "SERIAL_NUMBER BATTERY_LEVEL COLOR" or "SERIAL_NUMBER BATTERY_LEVEL" or just "SERIAL_NUMBER"
 */
export function parseSerialWithBattery(serialString: string): SerialWithBattery {
  const parts = serialString.trim().split(/\s+/);
  
  if (parts.length >= 3) {
    const secondPart = parts[1];
    const thirdPart = parts[2];
    
    const secondPartNum = parseInt(secondPart);
    const thirdPartNum = parseInt(thirdPart);
    
    // Check if second part is battery level (SERIAL BATTERY COLOR)
    if (!isNaN(secondPartNum) && secondPartNum >= 0 && secondPartNum <= 100) {
      return {
        serial: parts[0],
        batteryLevel: secondPartNum,
        color: thirdPart
      };
    }
    
    // Check if third part is battery level (SERIAL COLOR BATTERY)
    if (!isNaN(thirdPartNum) && thirdPartNum >= 0 && thirdPartNum <= 100) {
      return {
        serial: parts[0],
        batteryLevel: thirdPartNum,
        color: secondPart
      };
    }
    
    // If neither is a valid battery level, treat as serial with color only
    return {
      serial: parts[0],
      color: parts.slice(1).join(' ')
    };
  }
  
  if (parts.length === 2) {
    const secondPart = parts[1];
    const batteryLevel = parseInt(secondPart);
    
    // If second part is a number, treat as battery level
    if (!isNaN(batteryLevel) && batteryLevel >= 0 && batteryLevel <= 100) {
      return {
        serial: parts[0],
        batteryLevel: batteryLevel
      };
    }
    
    // Otherwise treat as color
    return {
      serial: parts[0],
      color: secondPart
    };
  }
  
  return {
    serial: serialString.trim()
  };
}

/**
 * Formats a serial number with battery level and color
 */
export function formatSerialWithBattery(serial: string, batteryLevel?: number, color?: string): string {
  let result = serial;
  if (batteryLevel !== undefined && batteryLevel >= 0 && batteryLevel <= 100) {
    result += ` ${batteryLevel}`;
  }
  if (color) {
    result += ` ${color}`;
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