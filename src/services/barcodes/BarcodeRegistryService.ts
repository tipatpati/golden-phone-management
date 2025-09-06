import { supabase } from "@/integrations/supabase/client";

export interface BarcodeRecord {
  id: string;
  barcode: string;
  barcode_type: 'unit' | 'product';
  entity_type: 'product' | 'product_unit';
  entity_id: string;
  format: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BarcodeConfig {
  prefix: string;
  format: string;
  counters: {
    unit: number;
    product: number;
  };
}

export class BarcodeRegistryService {
  private static async getBarcodeConfig(): Promise<BarcodeConfig> {
    const { data, error } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('setting_key', 'barcode_config')
      .single();

    if (error) {
      console.error('Failed to fetch barcode config:', error);
      // Return default config
      return {
        prefix: 'GPMS',
        format: 'CODE128',
        counters: { unit: 1000, product: 1000 }
      };
    }

    return data.setting_value as unknown as BarcodeConfig;
  }

  private static async updateBarcodeConfig(config: BarcodeConfig): Promise<void> {
    const { error } = await supabase
      .from('company_settings')
      .update({ setting_value: config as any })
      .eq('setting_key', 'barcode_config');

    if (error) {
      throw new Error(`Failed to update barcode config: ${error.message}`);
    }
  }

  private static async incrementCounter(type: 'unit' | 'product'): Promise<number> {
    // Get current config
    const config = await this.getBarcodeConfig();
    
    // Increment counter
    const newValue = config.counters[type] + 1;
    config.counters[type] = newValue;
    
    // Save back to database
    await this.updateBarcodeConfig(config);
    
    return newValue;
  }

  static async generateUniqueBarcode(
    entityType: 'product' | 'product_unit',
    entityId: string,
    barcodeType: 'unit' | 'product' = 'unit'
  ): Promise<string> {
    const config = await this.getBarcodeConfig();
    const counter = await this.incrementCounter(barcodeType);
    
    // Generate deterministic CODE128 barcode
    // Format: PREFIX + TYPE + COUNTER
    const typeCode = barcodeType === 'unit' ? 'U' : 'P';
    const paddedCounter = counter.toString().padStart(6, '0');
    const barcode = `${config.prefix}${typeCode}${paddedCounter}`;
    
    // Register barcode
    await this.registerBarcode(barcode, barcodeType, entityType, entityId);
    
    return barcode;
  }

  static async registerBarcode(
    barcode: string,
    barcodeType: 'unit' | 'product',
    entityType: 'product' | 'product_unit',
    entityId: string,
    metadata: Record<string, any> = {}
  ): Promise<BarcodeRecord> {
    const { data, error } = await supabase
      .from('barcode_registry')
      .insert({
        barcode,
        barcode_type: barcodeType,
        entity_type: entityType,
        entity_id: entityId,
        format: 'CODE128',
        metadata
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`Barcode ${barcode} already exists`);
      }
      throw new Error(`Failed to register barcode: ${error.message}`);
    }

    return data as BarcodeRecord;
  }

  static async getBarcodeByEntity(
    entityType: 'product' | 'product_unit',
    entityId: string
  ): Promise<BarcodeRecord | null> {
    const { data, error } = await supabase
      .from('barcode_registry')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      throw new Error(`Failed to fetch barcode: ${error.message}`);
    }

    return data as BarcodeRecord;
  }

  static async validateBarcodeUniqueness(barcode: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('barcode_registry')
      .select('id')
      .eq('barcode', barcode);

    if (error) {
      throw new Error(`Failed to validate barcode: ${error.message}`);
    }

    return data.length === 0;
  }

  static async getBarcodeHistory(entityId: string): Promise<BarcodeRecord[]> {
    const { data, error } = await supabase
      .from('barcode_registry')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch barcode history: ${error.message}`);
    }

    return data as BarcodeRecord[];
  }
}