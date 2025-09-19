/**
 * Unified Product Unit Management Service
 * Consolidates unit creation logic from inventory and supplier modules
 * Provides consistent barcode generation and unit management across the app
 */

import { supabase } from "@/integrations/supabase/client";
import { Services } from '@/services/core';
import type { ProductUnit, CreateProductUnitData, UnitEntryForm } from '@/services/inventory/types';
import { InventoryError, handleInventoryError } from '@/services/inventory/errors';
import { createRoleAwareSelect, sanitizePurchasePriceArray } from '@/utils/purchasePriceUtils';
import type { UserRole } from '@/types/roles';

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
          condition: entry.condition ?? 'new', // Default to 'new' for acquisitions
          price: entry.price ?? defaultPricing?.price,
          min_price: entry.min_price ?? defaultPricing?.min_price,
          max_price: entry.max_price ?? defaultPricing?.max_price,
          supplier_id: entry.supplier_id || metadata?.supplierId,
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
   * Get all units for a product with role-based purchase price filtering
   */
  static async getUnitsForProduct(productId: string, userRole?: UserRole | null): Promise<ProductUnit[]> {
    try {
      // Use role-aware select to automatically filter purchase prices
      const selectFields = userRole ? createRoleAwareSelect(userRole) : '*';
      
      const { data, error } = await supabase
        .from('product_units')
        .select(selectFields)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        throw InventoryError.createDatabaseError('getUnitsForProduct', error, { productId });
      }

      // Additional client-side sanitization as a safety net
      const units = (data || []) as any[];
      return userRole ? sanitizePurchasePriceArray(units as ProductUnit[], userRole) : (units as ProductUnit[]);
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
   * Update the purchase price of a product unit and sync related pricing
   */
  static async updateUnitPurchasePrice(unitId: string, purchasePrice: number): Promise<void> {
    try {
      console.log(`🔄 Updating unit ${unitId} purchase price to ${purchasePrice}`);
      
      const { error } = await supabase
        .from('product_units')
        .update({ 
          purchase_price: purchasePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', unitId);

      if (error) {
        throw InventoryError.createDatabaseError('updateUnitPurchasePrice', error, { unitId, purchasePrice });
      }
      
      console.log(`✅ Successfully updated unit ${unitId} purchase price`);
    } catch (error) {
      console.error(`❌ Failed to update unit ${unitId} purchase price:`, error);
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

      if (!entry.supplier_id?.trim()) {
        errors.push(`Supplier is required for ${entry.serial || 'unit'}`);
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

  /**
   * Delete unit safely with audit trail
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
   * Get specific units by their IDs
   */
  static async getUnitsByIds(unitIds: string[]): Promise<ProductUnit[]> {
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('*')
        .in('id', unitIds)
        .order('created_at', { ascending: false });

      if (error) {
        throw InventoryError.createDatabaseError('getUnitsByIds', error, { unitIds });
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
          // Generate barcode using the unified service
          const barcode = await this.generateBarcodeForUnit(unit.id);
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
   * Validate unit barcodes
   */
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

      const barcodeService = await Services.getBarcodeService();

      for (const unit of units) {
        if (!unit.barcode) {
          results.missing.push(unit.serial_number);
          continue;
        }

        const validation = await barcodeService.validateBarcode(unit.barcode);
        if (validation.isValid) {
          results.valid++;
        } else {
          results.invalid.push(`${unit.serial_number}: ${validation.errors?.join(', ') || 'Invalid format'}`);
        }
      }

      return results;
    } catch (error) {
      throw handleInventoryError(error);
    }
  }

  /**
   * Update pricing for existing units (used by pricing templates)
   */
  static async updateUnitsWithPricing(productId: string, unitEntries: UnitEntryForm[]): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    console.log('🔄 Updating unit pricing for product:', { productId, entries: unitEntries.length });

    for (const entry of unitEntries) {
      try {
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        };

        // Only update pricing fields that are provided
        if (entry.price !== undefined) updateData.price = entry.price;
        if (entry.min_price !== undefined) updateData.min_price = entry.min_price;
        if (entry.max_price !== undefined) updateData.max_price = entry.max_price;

        const { error } = await supabase
          .from('product_units')
          .update(updateData)
          .eq('product_id', productId)
          .eq('serial_number', entry.serial);

        if (error) {
          console.error(`Failed to update pricing for unit ${entry.serial}:`, error);
          errors.push(`${entry.serial}: ${error.message}`);
        } else {
          updated++;
          console.log(`✅ Updated pricing for unit ${entry.serial}`);
        }
      } catch (error) {
        console.error(`Error updating unit ${entry.serial}:`, error);
        errors.push(`${entry.serial}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`🎯 Unit pricing update completed: ${updated} updated, ${errors.length} errors`);
    return { updated, errors };
  }

  /**
   * Update product-level min/max prices based on actual unit prices
   */
  static async syncProductPricing(productId: string): Promise<void> {
    try {
      console.log('🔄 Syncing product-level pricing from units:', productId);

      // Get all available units for this product
      const units = await this.getAvailableUnitsForProduct(productId);
      
      if (units.length === 0) {
        console.log('No available units to sync pricing from');
        return;
      }

      // Calculate min/max from unit selling prices (prioritize unit min/max, fallback to unit price)
      const sellingPrices: number[] = [];
      
      units.forEach(unit => {
        // Collect all valid selling prices
        if (unit.min_price != null && unit.min_price > 0) {
          sellingPrices.push(unit.min_price);
        }
        if (unit.max_price != null && unit.max_price > 0) {
          sellingPrices.push(unit.max_price);
        }
        if (unit.price != null && unit.price > 0) {
          sellingPrices.push(unit.price);
        }
      });

      if (sellingPrices.length === 0) {
        console.log('No valid unit selling prices found');
        return;
      }

      const minPrice = Math.min(...sellingPrices);
      const maxPrice = Math.max(...sellingPrices);

      // Update product with calculated min/max prices
      const { error } = await supabase
        .from('products')
        .update({
          min_price: minPrice,
          max_price: maxPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        throw InventoryError.createDatabaseError('syncProductPricing', error, { productId });
      }

      console.log(`✅ Synced product pricing: min €${minPrice}, max €${maxPrice} from ${units.length} units`);
    } catch (error) {
      console.error('Error syncing product pricing:', error);
      throw handleInventoryError(error);
    }
  }

  /**
   * Get product by ID for cross-module integration
   */
  static async getProductById(productId: string): Promise<any> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
  }
}