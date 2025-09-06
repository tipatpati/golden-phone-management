// ============================================
// PRODUCT UNITS SERVICE - MIGRATED TO INVENTORY MODULE
// ============================================
// This service handles all product unit operations with proper error handling

import { supabase } from "@/integrations/supabase/client";
import { Code128GeneratorService } from '@/services/barcodes';
import type { ProductUnit, CreateProductUnitData, UnitEntryForm } from './types';
import { InventoryError, handleInventoryError } from './errors';

export class ProductUnitsService {
  /**
   * Create multiple product units with professional CODE128 barcodes
   */
  static async createUnitsForProduct(
    productId: string, 
    unitEntries: UnitEntryForm[],
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
          throw InventoryError.createDatabaseError('createUnit', error, { serial: entry.serial });
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
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        throw InventoryError.createDatabaseError('getUnitsForProduct', error, { productId });
      }

      return (data || []) as ProductUnit[];
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Update unit status
   */
  static async updateUnitStatus(
    unitId: string, 
    status: 'available' | 'sold' | 'reserved' | 'damaged'
  ): Promise<ProductUnit> {
    try {
      const { data, error } = await supabase
        .from('product_units')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', unitId)
        .select()
        .single();

      if (error) {
        throw InventoryError.createDatabaseError('updateUnitStatus', error, { unitId, status });
      }

      return data as ProductUnit;
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Delete unit
   */
  static async deleteUnit(unitId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('product_units')
        .delete()
        .eq('id', unitId);

      if (error) {
        throw InventoryError.createDatabaseError('deleteUnit', error, { unitId });
      }
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Get unit by serial number
   */
  static async getUnitBySerialNumber(serialNumber: string): Promise<ProductUnit | null> {
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('serial_number', serialNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw InventoryError.createDatabaseError('getUnitBySerialNumber', error, { serialNumber });
      }

      return data as ProductUnit;
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Get available units for a product
   */
  static async getAvailableUnitsForProduct(productId: string): Promise<ProductUnit[]> {
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error) {
        throw InventoryError.createDatabaseError('getAvailableUnitsForProduct', error, { productId });
      }

      return (data || []) as ProductUnit[];
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Backfill missing barcodes for existing units
   */
  static async backfillMissingBarcodes(): Promise<{ updated: number; errors: number }> {
    console.log('🔄 Starting barcode backfill for existing units...');

    try {
      // Get units without barcodes
      const { data: units, error } = await supabase
        .from('product_units')
        .select('*')
        .or('barcode.is.null,barcode.eq.""');

      if (error) {
        throw InventoryError.createDatabaseError('backfillMissingBarcodes', error);
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
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Update existing units with parsed data - legacy compatibility
   */
  static async updateExistingUnitsWithParsedData(): Promise<{ updated: number; errors: number }> {
    return this.backfillMissingBarcodes();
  }
  static async validateUnitBarcodes(productId?: string): Promise<{
    valid: number;
    invalid: string[];
    missing: string[];
  }> {
    try {
      let query = supabase.from('product_units').select('*');
      
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data: units, error } = await query;

      if (error) {
        throw InventoryError.createDatabaseError('validateUnitBarcodes', error, { productId });
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
    } catch (error) {
      throw handleInventoryError(error);
    }
  }
}