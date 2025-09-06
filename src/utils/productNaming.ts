/**
 * Product naming utilities following the "Brand Model Storage" convention
 */

export interface ProductNameData {
  brand: string;
  model: string;
  storage?: number;
}

export interface ProductUnitData extends ProductNameData {
  color?: string;
  batteryLevel?: number;
  serialNumber?: string;
}

/**
 * Formats a product name following the "Brand Model Storage" convention
 * @param data Product data containing brand, model, and optional storage
 * @returns Formatted product name (e.g., "Apple iPhone 15 Pro 256GB")
 */
export function formatProductName(data: ProductNameData): string {
  const { brand, model, storage } = data;
  
  let name = `${brand} ${model}`;
  
  if (storage && storage > 0) {
    name += ` ${storage}GB`;
  }
  
  return name.trim();
}

/**
 * Formats a product unit name without color concatenation
 * @param data Product unit data containing brand, model, storage
 * @returns Formatted unit name (e.g., "Apple iPhone 15 Pro 256GB")
 */
export function formatProductUnitName(data: ProductUnitData): string {
  // Color should NOT be concatenated with product name for database storage
  return formatProductName(data);
}

/**
 * Formats a product unit for display in lists/tables
 * @param data Product unit data
 * @returns Detailed unit display name
 */
export function formatProductUnitDisplay(data: ProductUnitData): string {
  let display = formatProductUnitName(data);
  
  if (data.batteryLevel && data.batteryLevel > 0) {
    display += ` (${data.batteryLevel}%)`;
  }
  
  return display;
}

/**
 * Extracts storage from a serial number string
 * @param serialString Serial number string that may contain storage info
 * @returns Storage value in GB or undefined
 */
export function extractStorageFromSerial(serialString: string): number | undefined {
  const storageMatch = serialString.match(/(\d+)GB/i);
  return storageMatch ? parseInt(storageMatch[1]) : undefined;
}

/**
 * Extracts color from a serial number string
 * @param serialString Serial number string that may contain color info
 * @returns Color string or undefined
 */
export function extractColorFromSerial(serialString: string): string | undefined {
  // Extract color between the IMEI and storage/battery info
  const parts = serialString.split(/\s+/);
  if (parts.length < 2) return undefined;
  
  const colorParts = [];
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    // Skip if it's storage (ends with GB) or battery (ends with %)
    if (!/(\d+GB|\d+%)$/i.test(part)) {
      colorParts.push(part);
    } else {
      break;
    }
  }
  
  return colorParts.length > 0 ? colorParts.join(' ') : undefined;
}

/**
 * Parses a serial number string into components
 * @param serialString Serial number string
 * @returns Parsed components
 */
export function parseSerialString(serialString: string): {
  serial: string;
  color?: string;
  storage?: number;
  batteryLevel?: number;
} {
  // Simple extraction - no complex parsing
  return {
    serial: serialString.trim(),
  };
}