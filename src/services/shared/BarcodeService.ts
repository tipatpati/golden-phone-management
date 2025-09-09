/**
 * Injectable Barcode Service Implementation
 * Combines generation and registry functionality with proper DI support
 */

import { supabase } from "@/integrations/supabase/client";
import type { 
  IBarcodeService, 
  BarcodeGenerationOptions, 
  BarcodeValidationResult, 
  BarcodeRecord 
} from './interfaces/IBarcodeService';

export class BarcodeService implements IBarcodeService {
  private configCache: {
    prefix: string;
    format: string;
    counters: { unit: number; product: number };
  } | null = null;

  constructor() {
    this.initializeConfig();
  }

  /**
   * Generate barcode for product unit
   */
  async generateUnitBarcode(unitId: string, options?: BarcodeGenerationOptions): Promise<string> {
    const config = await this.getConfig();
    const counter = await this.incrementCounter('unit');
    
    const prefix = options?.prefix || config.prefix;
    const barcode = `${prefix}U${counter.toString().padStart(6, '0')}`;
    
    // Validate barcode
    const validation = this.validateBarcode(barcode);
    if (!validation.isValid) {
      throw new Error(`Generated invalid barcode: ${validation.errors?.join(', ')}`);
    }
    
    // Register barcode
    await this.registerBarcode(barcode, 'unit', 'product_unit', unitId, options?.metadata);
    
    return barcode;
  }

  /**
   * Generate barcode for product
   */
  async generateProductBarcode(productId: string, options?: BarcodeGenerationOptions): Promise<string> {
    const config = await this.getConfig();
    const counter = await this.incrementCounter('product');
    
    const prefix = options?.prefix || config.prefix;
    const barcode = `${prefix}P${counter.toString().padStart(6, '0')}`;
    
    // Validate barcode
    const validation = this.validateBarcode(barcode);
    if (!validation.isValid) {
      throw new Error(`Generated invalid barcode: ${validation.errors?.join(', ')}`);
    }
    
    // Register barcode
    await this.registerBarcode(barcode, 'product', 'product', productId, options?.metadata);
    
    return barcode;
  }

  /**
   * Generate multiple barcodes in bulk
   */
  async generateBulkBarcodes(requests: Array<{
    entityId: string;
    type: 'unit' | 'product';
    options?: BarcodeGenerationOptions;
  }>): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const request of requests) {
      try {
        const barcode = request.type === 'unit' 
          ? await this.generateUnitBarcode(request.entityId, request.options)
          : await this.generateProductBarcode(request.entityId, request.options);
        
        results[request.entityId] = barcode;
      } catch (error) {
        console.error(`Failed to generate barcode for ${request.entityId}:`, error);
        // Continue with other requests
      }
    }
    
    return results;
  }

  /**
   * Validate barcode format and content
   */
  validateBarcode(barcode: string): BarcodeValidationResult {
    const errors: string[] = [];
    
    // Basic length check
    if (!barcode || barcode.length < 8 || barcode.length > 20) {
      errors.push('Barcode length must be between 8 and 20 characters');
    }
    
    // Character set validation for CODE128
    const code128Pattern = /^[A-Za-z0-9\-_.+%$\/\s]*$/;
    if (!code128Pattern.test(barcode)) {
      errors.push('Barcode contains invalid characters for CODE128 format');
    }
    
    // GPMS format validation
    const gpmsPattern = /^([A-Z]+)([UP])(\d{6,})$/;
    const match = barcode.match(gpmsPattern);
    
    if (!match) {
      errors.push('Barcode does not match GPMS format (PREFIX[U|P]NNNNNN)');
    }
    
    const parsedData = match ? {
      prefix: match[1],
      type: (match[2] === 'U' ? 'unit' : match[2] === 'P' ? 'product' : 'unknown') as 'unit' | 'product' | 'unknown',
      counter: parseInt(match[3], 10)
    } : undefined;
    
    return {
      isValid: errors.length === 0,
      format: 'CODE128',
      errors: errors.length > 0 ? errors : undefined,
      parsedData
    };
  }

  /**
   * Parse barcode information
   */
  parseBarcode(barcode: string): BarcodeValidationResult['parsedData'] {
    const validation = this.validateBarcode(barcode);
    return validation.parsedData;
  }

  /**
   * Register barcode in the system
   */
  async registerBarcode(
    barcode: string,
    barcodeType: 'unit' | 'product',
    entityType: 'product' | 'product_unit',
    entityId: string,
    metadata?: Record<string, any>
  ): Promise<BarcodeRecord> {
    // Check uniqueness first
    const isUnique = await this.validateUniqueness(barcode);
    if (!isUnique) {
      throw new Error(`Barcode '${barcode}' already exists in the system`);
    }

    const { data, error } = await supabase
      .from('barcode_registry')
      .insert([{
        barcode,
        barcode_type: barcodeType,
        entity_type: entityType,
        entity_id: entityId,
        format: 'CODE128',
        metadata: metadata || {}
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to register barcode: ${error.message}`);
    }

    return data as BarcodeRecord;
  }

  /**
   * Get barcode record by entity
   */
  async getBarcodeByEntity(entityType: 'product' | 'product_unit', entityId: string): Promise<BarcodeRecord | null> {
    const { data, error } = await supabase
      .from('barcode_registry')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch barcode by entity:', error);
      return null;
    }

    return data as BarcodeRecord;
  }

  /**
   * Check if barcode is unique
   */
  async validateUniqueness(barcode: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('barcode_registry')
      .select('id')
      .eq('barcode', barcode)
      .limit(1);

    if (error) {
      console.error('Failed to check barcode uniqueness:', error);
      return false;
    }

    return !data || data.length === 0;
  }

  /**
   * Get barcode history for an entity
   */
  async getBarcodeHistory(entityId: string): Promise<BarcodeRecord[]> {
    const { data, error } = await supabase
      .from('barcode_registry')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch barcode history:', error);
      return [];
    }

    return (data || []) as BarcodeRecord[];
  }

  /**
   * Update barcode configuration
   */
  async updateConfig(config: {
    prefix: string;
    format: string;
    counters: { unit: number; product: number };
  }): Promise<void> {
    const { error } = await supabase
      .from('company_settings')
      .upsert({
        setting_key: 'barcode_config',
        setting_value: config as any
      });

    if (error) {
      throw new Error(`Failed to update barcode config: ${error.message}`);
    }

    // Clear cache
    this.configCache = null;
  }

  /**
   * Get or generate barcode for entity
   */
  async getOrGenerateBarcode(
    entityType: 'product' | 'product_unit',
    entityId: string,
    barcodeType: 'unit' | 'product',
    options?: BarcodeGenerationOptions
  ): Promise<string> {
    // Try to get existing barcode first
    const existing = await this.getBarcodeByEntity(entityType, entityId);
    if (existing) {
      return existing.barcode;
    }

    // Generate new barcode
    return barcodeType === 'unit' 
      ? this.generateUnitBarcode(entityId, options)
      : this.generateProductBarcode(entityId, options);
  }

  /**
   * Health check for barcode service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      // Test database connectivity
      const { error: dbError } = await supabase
        .from('company_settings')
        .select('setting_key')
        .limit(1);

      if (dbError) {
        return {
          status: 'unhealthy',
          details: { database: 'Failed to connect', error: dbError.message }
        };
      }

      // Test config access
      const config = await this.getConfig();
      
      return {
        status: 'healthy',
        details: {
          database: 'Connected',
          config: 'Loaded',
          counters: config.counters
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  private async initializeConfig(): Promise<void> {
    try {
      await this.getConfig();
    } catch (error) {
      console.warn('Failed to initialize barcode config:', error);
    }
  }

  private async getConfig() {
    if (this.configCache) {
      return this.configCache;
    }

    const { data, error } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('setting_key', 'barcode_config')
      .single();

    if (error) {
      // Return default config
      this.configCache = {
        prefix: 'GPMS',
        format: 'CODE128',
        counters: { unit: 1000, product: 1000 }
      };
    } else {
      this.configCache = data.setting_value as any;
    }

    return this.configCache;
  }

  private async incrementCounter(type: 'unit' | 'product'): Promise<number> {
    const config = await this.getConfig();
    config.counters[type]++;
    
    await this.updateConfig(config);
    return config.counters[type];
  }
}