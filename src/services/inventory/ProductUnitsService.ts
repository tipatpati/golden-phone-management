// ============================================
// PRODUCT UNITS SERVICE - MIGRATED TO SHARED SERVICE
// ============================================
// This service now delegates to the unified ProductUnitManagementService

import { supabase } from "@/integrations/supabase/client";
import { Code128GeneratorService } from '@/services/barcodes';
import { ProductUnitManagementService } from '@/services/shared/ProductUnitManagementService';
import type { ProductUnit, UnitEntryForm } from './types';
import { InventoryError, handleInventoryError } from './errors';

export class ProductUnitsService {
  /**
   * Create multiple product units - delegates to unified service
   * @deprecated Use ProductUnitManagementService.createUnitsForProduct instead
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
    try {
      const result = await ProductUnitManagementService.createUnitsForProduct({
        productId,
        unitEntries,
        defaultPricing
      });

      if (result.errors.length > 0) {
        console.warn('Some units failed to create:', result.errors);
      }

      return result.units;
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Get all units for a product - delegates to unified service
   */
  static async getUnitsForProduct(productId: string): Promise<ProductUnit[]> {
    return ProductUnitManagementService.getUnitsForProduct(productId);
  }

  /**
   * Update unit status - delegates to unified service
   */
  static async updateUnitStatus(
    unitId: string, 
    status: 'available' | 'sold' | 'reserved' | 'damaged'
  ): Promise<ProductUnit> {
    return ProductUnitManagementService.updateUnitStatus(unitId, status);
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