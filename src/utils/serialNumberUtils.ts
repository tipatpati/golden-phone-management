export interface SerialWithBattery {
  serial: string;
  batteryLevel?: number;
}

/**
 * Parses a serial number string that may include battery level
 * Format: "SERIAL_NUMBER BATTERY_LEVEL" or just "SERIAL_NUMBER"
 */
export function parseSerialWithBattery(serialString: string): SerialWithBattery {
  const parts = serialString.trim().split(/\s+/);
  
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
 * Formats a serial number with battery level
 */
export function formatSerialWithBattery(serial: string, batteryLevel?: number): string {
  if (batteryLevel !== undefined && batteryLevel >= 0 && batteryLevel <= 100) {
    return `${serial} ${batteryLevel}`;
  }
  return serial;
}

/**
 * Validates a serial number with battery level format
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