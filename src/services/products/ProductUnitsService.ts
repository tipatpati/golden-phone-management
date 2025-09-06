import { supabase } from "@/integrations/supabase/client";
import { Code128GeneratorService } from '@/services/barcodes';

export interface ProductUnit {
  id: string;
  product_id: string;
  serial_number: string;
  barcode?: string;
  battery_level?: number;
  color?: string;
  storage?: number;
  ram?: number;
  price?: number;
  min_price?: number;
  max_price?: number;
  status: 'available' | 'sold' | 'reserved' | 'damaged';
  created_at: string;
  updated_at: string;
}

export interface CreateProductUnitData {
  product_id: string;
  serial_number: string;
  battery_level?: number;
  color?: string;
  storage?: number;
  ram?: number;
  price?: number;
  min_price?: number;
  max_price?: number;
  status?: 'available' | 'sold' | 'reserved' | 'damaged';
}

export class ProductUnitsService {
  /**
   * Create multiple product units with professional CODE128 barcodes
   */
  static async createUnitsForProduct(
    productId: string, 
    unitEntries: Array<{
      serial: string;
      price?: number;
      min_price?: number;
      max_price?: number;
      battery_level?: number;
      color?: string;
      storage?: number;
      ram?: number;
    }>,
    defaultPricing?: {
      price?: number;
      min_price?: number;
      max_price?: number;
    }
  ): Promise<ProductUnit[]> {
    console.log('🏭 Creating product units with professional barcodes:', { productId, count: unitEntries.length });

    const results: ProductUnit[] = [];
    const errors: string[] = [];

    for (const entry of unitEntries) {
      try {
        // First create the unit without barcode
        const unitData: CreateProductUnitData = {
          product_id: productId,
          serial_number: entry.serial,
          battery_level: entry.battery_level,
          color: entry.color,
          storage: entry.storage,
          ram: entry.ram,
          price: entry.price ?? defaultPricing?.price,
          min_price: entry.min_price ?? defaultPricing?.min_price,
          max_price: entry.max_price ?? defaultPricing?.max_price,
          status: 'available'
        };

        const { data: unit, error } = await supabase
          .from('product_units')
          .insert(unitData)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create unit: ${error.message}`);
        }

        // Generate professional CODE128 barcode
        const barcode = await Code128GeneratorService.generateUnitBarcode(unit.id, {
          metadata: {
            serial: entry.serial,
            product_id: productId,
            battery_level: entry.battery_level,
            color: entry.color,
            storage: entry.storage,
            ram: entry.ram
          }
        });

        // Update unit with barcode
        const { data: updatedUnit, error: updateError } = await supabase
          .from('product_units')
          .update({ barcode })
          .eq('id', unit.id)
          .select()
          .single();

        if (updateError) {
          console.error('Failed to update unit with barcode:', updateError);
          // Continue with unit without barcode rather than failing
          results.push(unit as ProductUnit);
        } else {
          results.push(updatedUnit as ProductUnit);
        }

        console.log(`✅ Created unit with barcode:`, { serial: entry.serial, barcode });

      } catch (error) {
        console.error(`Failed to create unit for serial ${entry.serial}:`, error);
        errors.push(`${entry.serial}: ${error}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Some units failed to create:', errors);
    }

    console.log('🎯 Product units creation completed:', { created: results.length, errors: errors.length });
    return results;
  }

  /**
   * Get all units for a product
   */
  static async getUnitsForProduct(productId: string): Promise<ProductUnit[]> {
    const { data, error } = await supabase
      .from('product_units')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch product units: ${error.message}`);
    }

    return (data || []) as ProductUnit[];
  }

  /**
   * Update unit status
   */
  static async updateUnitStatus(
    unitId: string, 
    status: 'available' | 'sold' | 'reserved' | 'damaged'
  ): Promise<ProductUnit> {
    const { data, error } = await supabase
      .from('product_units')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', unitId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update unit status: ${error.message}`);
    }

    return data as ProductUnit;
  }

  /**
   * Delete unit
   */
  static async deleteUnit(unitId: string): Promise<void> {
    const { error } = await supabase
      .from('product_units')
      .delete()
      .eq('id', unitId);

    if (error) {
      throw new Error(`Failed to delete unit: ${error.message}`);
    }
  }

  /**
   * Get unit by serial number
   */
  static async getUnitBySerialNumber(serialNumber: string): Promise<ProductUnit | null> {
    const { data, error } = await supabase
      .from('product_units')
      .select('*')
      .eq('serial_number', serialNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      throw new Error(`Failed to fetch unit: ${error.message}`);
    }

    return data as ProductUnit;
  }

  /**
   * Get available units for a product
   */
  static async getAvailableUnitsForProduct(productId: string): Promise<ProductUnit[]> {
    const { data, error } = await supabase
      .from('product_units')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch available units: ${error.message}`);
    }

    return (data || []) as ProductUnit[];
  }

  /**
   * Backfill missing barcodes for existing units
   */
  static async backfillMissingBarcodes(): Promise<{ updated: number; errors: number }> {
    console.log('🔄 Starting barcode backfill for existing units...');

    // Get units without barcodes
    const { data: units, error } = await supabase
      .from('product_units')
      .select('*')
      .or('barcode.is.null,barcode.eq.""');

    if (error) {
      throw new Error(`Failed to fetch units for backfill: ${error.message}`);
    }

    if (!units || units.length === 0) {
      console.log('✅ No units need barcode backfill');
      return { updated: 0, errors: 0 };
    }

    console.log(`📦 Found ${units.length} units needing barcodes`);

    let updated = 0;
    let errors = 0;

    for (const unit of units) {
      try {
        // Generate professional barcode for this specific unit
        const barcode = await Code128GeneratorService.generateUnitBarcode(unit.id, {
          metadata: {
            serial: unit.serial_number,
            product_id: unit.product_id,
            battery_level: unit.battery_level,
            color: unit.color,
            storage: unit.storage,
            ram: unit.ram
          }
        });

        // Update unit with barcode
        const { error: updateError } = await supabase
          .from('product_units')
          .update({ barcode })
          .eq('id', unit.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        updated++;
        console.log(`✅ Updated unit ${unit.serial_number} with barcode ${barcode}`);

      } catch (error) {
        console.error(`❌ Failed to generate barcode for unit ${unit.serial_number}:`, error);
        errors++;
      }
    }

    console.log(`🎯 Barcode backfill completed: ${updated} updated, ${errors} errors`);
    return { updated, errors };
  }

  /**
   * Update existing units with parsed data - legacy compatibility
   */
  static async updateExistingUnitsWithParsedData(): Promise<{ updated: number; errors: number }> {
    return this.backfillMissingBarcodes();
  }

  /**
   * Validate unit barcodes
   */
  static async validateUnitBarcodes(productId?: string): Promise<{
    valid: number;
    invalid: string[];
    missing: string[];
  }> {
    let query = supabase.from('product_units').select('*');
    
    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: units, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch units for validation: ${error.message}`);
    }

    if (!units) {
      return { valid: 0, invalid: [], missing: [] };
    }

    const results = {
      valid: 0,
      invalid: [] as string[],
      missing: [] as string[]
    };

    for (const unit of units) {
      if (!unit.barcode) {
        results.missing.push(unit.serial_number);
        continue;
      }

      const validation = Code128GeneratorService.validateCode128(unit.barcode);
      if (validation.isValid) {
        results.valid++;
      } else {
        results.invalid.push(`${unit.serial_number}: ${validation.errors.join(', ')}`);
      }
    }

    return results;
  }
}