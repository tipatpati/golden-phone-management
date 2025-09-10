// ============================================
// CROSS-MODULE DATA SYNCHRONIZATION UTILITIES
// ============================================
// Utilities to ensure consistent data flow between supplier and inventory modules

import type { ProductFormData, UnitEntryForm, ProductUnit } from '@/services/inventory/types';

export interface DataTransformationLog {
  source: string;
  target: string;
  input: any;
  output: any;
  timestamp: Date;
  success: boolean;
  errors?: string[];
}

const transformationLogs: DataTransformationLog[] = [];

/**
 * Log data transformation for debugging cross-module issues
 */
export function logDataTransformation(log: DataTransformationLog): void {
  transformationLogs.push(log);
  console.log(`🔄 Data Transform [${log.source} → ${log.target}]:`, {
    success: log.success,
    errors: log.errors,
    inputKeys: Object.keys(log.input || {}),
    outputKeys: Object.keys(log.output || {})
  });
  
  // Keep only last 100 logs
  if (transformationLogs.length > 100) {
    transformationLogs.shift();
  }
}

/**
 * Get recent transformation logs for debugging
 */
export function getTransformationLogs(): DataTransformationLog[] {
  return [...transformationLogs];
}

/**
 * Transform ProductUnit[] to UnitEntryForm[] consistently across modules
 */
export function transformUnitsToEntries(units: ProductUnit[]): UnitEntryForm[] {
  const log: DataTransformationLog = {
    source: 'ProductUnit[]',
    target: 'UnitEntryForm[]',
    input: units,
    output: null,
    timestamp: new Date(),
    success: false
  };

  try {
    if (!Array.isArray(units)) {
      throw new Error('Input is not an array');
    }

    const entries = units.map(unit => ({
      serial: unit.serial_number || '',
      battery_level: unit.battery_level || 0,
      color: unit.color || '',
      storage: unit.storage || 0,
      ram: unit.ram || 0,
      price: unit.price,
      min_price: unit.min_price,
      max_price: unit.max_price,
    } as UnitEntryForm));

    log.output = entries;
    log.success = true;
    logDataTransformation(log);
    
    return entries;
  } catch (error) {
    log.errors = [error instanceof Error ? error.message : 'Unknown transformation error'];
    logDataTransformation(log);
    return [];
  }
}

/**
 * Transform UnitEntryForm[] to ProductUnit[] for database operations
 */
export function transformEntriesToUnits(
  entries: UnitEntryForm[], 
  productId: string
): Partial<ProductUnit>[] {
  const log: DataTransformationLog = {
    source: 'UnitEntryForm[]',
    target: 'ProductUnit[]',
    input: entries,
    output: null,
    timestamp: new Date(),
    success: false
  };

  try {
    if (!Array.isArray(entries)) {
      throw new Error('Input is not an array');
    }

    const units = entries
      .filter(entry => entry.serial?.trim())
      .map(entry => ({
        product_id: productId,
        serial_number: entry.serial,
        battery_level: entry.battery_level || 0,
        color: entry.color || '',
        storage: entry.storage || 0,
        ram: entry.ram || 0,
        price: entry.price,
        min_price: entry.min_price,
        max_price: entry.max_price,
        status: 'available' as const
      }));

    log.output = units;
    log.success = true;
    logDataTransformation(log);
    
    return units;
  } catch (error) {
    log.errors = [error instanceof Error ? error.message : 'Unknown transformation error'];
    logDataTransformation(log);
    return [];
  }
}

/**
 * Validate that data contains expected unit information
 */
export function validateProductUnitsData(data: any): {
  isValid: boolean;
  hasUnits: boolean;
  unitCount: number;
  errors: string[];
} {
  const result = {
    isValid: true,
    hasUnits: false,
    unitCount: 0,
    errors: [] as string[]
  };

  try {
    // Check for units field
    if (data.units && Array.isArray(data.units)) {
      result.hasUnits = true;
      result.unitCount = data.units.length;
      console.log(`✅ Found ${data.units.length} units in data.units`);
    }
    
    // Check for product_units field  
    if (data.product_units && Array.isArray(data.product_units)) {
      result.hasUnits = true;
      result.unitCount = Math.max(result.unitCount, data.product_units.length);
      console.log(`✅ Found ${data.product_units.length} units in data.product_units`);
    }
    
    // Check for unit_entries field
    if (data.unit_entries && Array.isArray(data.unit_entries)) {
      result.hasUnits = true;
      result.unitCount = Math.max(result.unitCount, data.unit_entries.length);
      console.log(`✅ Found ${data.unit_entries.length} units in data.unit_entries`);
    }
    
    // Check legacy serial_numbers
    if (data.serial_numbers && Array.isArray(data.serial_numbers)) {
      result.hasUnits = true;
      result.unitCount = Math.max(result.unitCount, data.serial_numbers.length);
      console.log(`✅ Found ${data.serial_numbers.length} serials in data.serial_numbers`);
    }

    if (!result.hasUnits && data.has_serial) {
      result.errors.push('Product marked as serialized but no unit data found');
      result.isValid = false;
    }

  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Validation error');
    result.isValid = false;
  }

  return result;
}
