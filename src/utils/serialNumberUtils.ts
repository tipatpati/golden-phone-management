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
    const batteryLevel = parseInt(parts[parts.length - 2]);
    const color = parts[parts.length - 1];
    if (!isNaN(batteryLevel) && batteryLevel >= 0 && batteryLevel <= 100) {
      return {
        serial: parts.slice(0, -2).join(' '),
        batteryLevel: batteryLevel,
        color: color
      };
    }
  }
  
  if (parts.length >= 2) {
    const batteryLevel = parseInt(parts[parts.length - 1]);
    if (!isNaN(batteryLevel) && batteryLevel >= 0 && batteryLevel <= 100) {
      return {
        serial: parts.slice(0, -1).join(' '),
        batteryLevel: batteryLevel
      };
    }
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
  
  if (parts.length >= 3) {
    // Format: SERIAL BATTERY COLOR
    const batteryLevel = parseInt(parts[parts.length - 2]);
    if (isNaN(batteryLevel)) {
      return { isValid: false, error: "Battery level must be a number" };
    }
    if (batteryLevel < 0 || batteryLevel > 100) {
      return { isValid: false, error: "Battery level must be between 0 and 100" };
    }
    return { isValid: true };
  }
  
  if (parts.length >= 2) {
    const batteryLevel = parseInt(parts[parts.length - 1]);
    if (isNaN(batteryLevel)) {
      return { isValid: false, error: "Battery level must be a number" };
    }
    if (batteryLevel < 0 || batteryLevel > 100) {
      return { isValid: false, error: "Battery level must be between 0 and 100" };
    }
    return { isValid: true };
  }
  
  return { isValid: true };
}