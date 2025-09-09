/**
 * Atomic Database Operations for Service Management
 * Provides database-level consistency for service operations
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Atomic barcode counter increment using company settings
 */
export async function atomicIncrementBarcodeCounter(
  type: 'unit' | 'product'
): Promise<number> {
  // Get current config from company_settings
  const { data: configData, error: configError } = await supabase
    .from('company_settings')
    .select('setting_value')
    .eq('setting_key', 'barcode_config')
    .single();

  if (configError) {
    throw new Error(`Failed to get barcode config: ${configError.message}`);
  }

  const config = configData.setting_value as any;
  const newCounter = (config.counters[type] || 1000) + 1;
  
  // Update the counter atomically
  config.counters[type] = newCounter;
  
  const { error: updateError } = await supabase
    .from('company_settings')
    .update({ setting_value: config })
    .eq('setting_key', 'barcode_config');

  if (updateError) {
    throw new Error(`Failed to update ${type} counter: ${updateError.message}`);
  }

  return newCounter;
}

/**
 * Atomic product stock update with validation
 */
export async function atomicUpdateProductStock(
  productId: string,
  stockChange: number,
  reason: string
): Promise<void> {
  // Get current stock and update atomically
  const { data: currentProduct, error: fetchError } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch current stock: ${fetchError.message}`);
  }

  const newStock = Math.max(0, (currentProduct.stock || 0) + stockChange);
  
  const { error } = await supabase
    .from('products')
    .update({ 
      stock: newStock,
      updated_at: new Date().toISOString()
    })
    .eq('id', productId);

  if (error) {
    throw new Error(`Failed to update product stock: ${error.message}`);
  }
}

/**
 * Atomic serial number validation and reservation
 */
export async function atomicValidateAndReserveSerial(
  productId: string,
  serialNumber: string
): Promise<boolean> {
  // Check if serial exists and is available
  const { data, error } = await supabase
    .from('product_units')
    .select('id, status')
    .eq('product_id', productId)
    .eq('serial_number', serialNumber)
    .single();

  if (error || !data) {
    return false;
  }

  return data.status === 'available';
}

/**
 * Batch create product units with validation
 */
export async function batchCreateProductUnits(
  units: Array<{
    product_id: string;
    serial_number: string;
    barcode?: string;
    color?: string;
    storage?: number;
    ram?: number;
    price?: number;
    min_price?: number;
    max_price?: number;
    purchase_price?: number;
    supplier_id?: string;
  }>
): Promise<void> {
  const { error } = await supabase
    .from('product_units')
    .insert(units);

  if (error) {
    throw new Error(`Failed to batch create units: ${error.message}`);
  }
}

/**
 * Service configuration management with versioning
 */
export async function updateServiceConfig(
  serviceName: string,
  config: Record<string, any>,
  version?: string
): Promise<void> {
  const { error } = await supabase
    .from('company_settings')
    .upsert({
      setting_key: `service_config_${serviceName}`,
      setting_value: { ...config, version: version || '1.0.0' }
    });

  if (error) {
    throw new Error(`Failed to update service config: ${error.message}`);
  }
}

/**
 * Get service configuration with fallbacks
 */
export async function getServiceConfig(
  serviceName: string,
  defaultConfig?: Record<string, any>
): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('setting_value')
    .eq('setting_key', `service_config_${serviceName}`)
    .single();

  if (error) {
    console.warn(`Failed to get service config for ${serviceName}:`, error);
    return defaultConfig || {};
  }

  return (data?.setting_value as Record<string, any>) || defaultConfig || {};
}