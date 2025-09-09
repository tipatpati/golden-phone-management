/**
 * Unified Product Unit Management Service
 * Consolidates unit creation logic from inventory and supplier modules
 * Provides consistent barcode generation and unit management across the app
 */

import { supabase } from "@/integrations/supabase/client";
import { Services } from '@/services/core';
import type { ProductUnit, CreateProductUnitData, UnitEntryForm } from '@/services/inventory/types';
import { InventoryError, handleInventoryError } from '@/services/inventory/errors';

interface CreateUnitsParams {
  productId: string;
  unitEntries: UnitEntryForm[];
  defaultPricing?: {
    price?: number;
    min_price?: number;
    max_price?: number;
  };
  metadata?: {
    supplierId?: string;
    transactionId?: string;
    acquisitionDate?: Date;
  };
}

interface CreateUnitsResult {
  units: ProductUnit[];
  barcodes: Record<string, string>; // serialNumber -> barcode
  errors: string[];
}

export class ProductUnitManagementService {
  /**
   * Create multiple product units with integrated barcode generation
   * Used by both inventory and supplier modules
   */
  static async createUnitsForProduct(params: CreateUnitsParams): Promise<CreateUnitsResult> {
    const { productId, unitEntries, defaultPricing, metadata } = params;
    console.log('🏭 Creating unified product units:', { productId, count: unitEntries.length, metadata });

    const barcodeService = await Services.getBarcodeService();
    const results: ProductUnit[] = [];
    const barcodes: Record<string, string> = {};
    const errors: string[] = [];

    for (const entry of unitEntries) {
      try {
        // Create unit data with all available information
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

        // Create the unit
        const { data: unit, error } = await supabase
          .from('product_units')
          .insert(unitData)
          .select()
          .single();

        if (error) {
          throw InventoryError.createDatabaseError('createUnit', error, { serial: entry.serial });
        }

        // Generate professional barcode using injectable service
        const barcode = await barcodeService.generateUnitBarcode(unit.id, {
          metadata: {
            serial: entry.serial,
            product_id: productId,
            battery_level: entry.battery_level,
            color: entry.color,
            storage: entry.storage,
            ram: entry.ram,
            supplier_id: metadata?.supplierId,
            transaction_id: metadata?.transactionId
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
          errors.push(`Failed to set barcode for ${entry.serial}: ${updateError.message}`);
        } else {
          results.push(updatedUnit as ProductUnit);
          barcodes[entry.serial] = barcode;
        }

        console.log(`✅ Created unified unit:`, { serial: entry.serial, barcode, metadata });

      } catch (error) {
        console.error(`Failed to create unit for serial ${entry.serial}:`, error);
        errors.push(`${entry.serial}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log('🎯 Unified unit creation completed:', { 
      created: results.length, 
      errors: errors.length,
      barcodes: Object.keys(barcodes).length 
    });
    
    return { units: results, barcodes, errors };
  }

  /**
   * Get all units for a product with barcode information
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
   * Update unit status with audit trail
   */
  static async updateUnitStatus(
    unitId: string, 
    status: 'available' | 'sold' | 'reserved' | 'damaged',
    metadata?: Record<string, any>
  ): Promise<ProductUnit> {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...(metadata && { metadata })
      };

      const { data, error } = await supabase
        .from('product_units')
        .update(updateData)
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
   * Generate or regenerate barcode for an existing unit
   */
  static async generateBarcodeForUnit(unitId: string): Promise<string> {
    try {
      const barcodeService = await Services.getBarcodeService();
      
      // Get unit information
      const { data: unit, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('id', unitId)
        .single();

      if (error) {
        throw InventoryError.createDatabaseError('getBarcodeForUnit', error, { unitId });
      }

      // Generate new barcode
      const barcode = await barcodeService.generateUnitBarcode(unitId, {
        metadata: {
          serial: unit.serial_number,
          product_id: unit.product_id,
          battery_level: unit.battery_level,
          color: unit.color,
          storage: unit.storage,
          ram: unit.ram
        }
      });

      // Update unit with new barcode
      const { error: updateError } = await supabase
        .from('product_units')
        .update({ barcode })
        .eq('id', unitId);

      if (updateError) {
        throw InventoryError.createDatabaseError('updateUnitBarcode', updateError, { unitId });
      }

      return barcode;
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Validate unit entries before creation
   */
  static validateUnitEntries(entries: UnitEntryForm[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const serials = new Set<string>();

    for (const entry of entries) {
      if (!entry.serial?.trim()) {
        errors.push('Serial number is required');
        continue;
      }

      if (serials.has(entry.serial)) {
        errors.push(`Duplicate serial number: ${entry.serial}`);
      } else {
        serials.add(entry.serial);
      }

      if (entry.price !== undefined && entry.price < 0) {
        errors.push(`Invalid price for ${entry.serial}: must be non-negative`);
      }

      if (entry.min_price !== undefined && entry.max_price !== undefined && entry.min_price >= entry.max_price) {
        errors.push(`Invalid price range for ${entry.serial}: min must be less than max`);
      }

      if (entry.battery_level !== undefined && (entry.battery_level < 0 || entry.battery_level > 100)) {
        errors.push(`Invalid battery level for ${entry.serial}: must be 0-100`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Bulk operations for efficiency
   */
  static async createUnitsInBulk(operations: CreateUnitsParams[]): Promise<CreateUnitsResult[]> {
    const results: CreateUnitsResult[] = [];

    for (const operation of operations) {
      try {
        const result = await this.createUnitsForProduct(operation);
        results.push(result);
      } catch (error) {
        console.error('Bulk operation failed:', error);
        results.push({
          units: [],
          barcodes: {},
          errors: [error instanceof Error ? error.message : String(error)]
        });
      }
    }

    return results;
  }
}