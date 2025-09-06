import { supabase } from "@/integrations/supabase/client";
import { generateIMEIBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";

export interface ProductUnit {
  id: string;
  product_id: string;
  serial_number: string;
  barcode?: string;
  color?: string;
  battery_level?: number;
  storage?: number; // Storage in GB (64, 128, 256, etc.)
  ram?: number; // RAM in GB (4, 6, 8, 12, 16, etc.)
  price?: number;      // Base purchase price for this unit
  min_price?: number;  // Minimum selling price for this unit
  max_price?: number;  // Maximum selling price for this unit
  status: 'available' | 'sold' | 'reserved' | 'damaged';
  created_at: string;
  updated_at: string;
}

export interface CreateProductUnitData {
  product_id: string;
  serial_number: string;
  color?: string;
  battery_level?: number;
  storage?: number;
  ram?: number;
  price?: number;      // Base purchase price for this unit
  min_price?: number;  // Minimum selling price for this unit
  max_price?: number;  // Maximum selling price for this unit
  status?: 'available' | 'sold' | 'reserved' | 'damaged';
}

export class ProductUnitsService {
  static async createUnitsForProduct(
    productId: string, 
    serialNumbers: string[],
    defaultPricing?: { price?: number; min_price?: number; max_price?: number }
  ): Promise<ProductUnit[]> {
    const units = serialNumbers.map(serialLine => {
      const parsed = parseSerialWithBattery(serialLine);
      const barcodeResult = generateIMEIBarcode(parsed.serial, { 
        format: 'AUTO',
        productId 
      });
      
      return {
        product_id: productId,
        serial_number: parsed.serial,
        barcode: barcodeResult.barcode,
        color: parsed.color,
        battery_level: parsed.batteryLevel,
        storage: parsed.storage,
        ram: parsed.ram,
        price: parsed.price ?? defaultPricing?.price,
        min_price: parsed.minPrice ?? defaultPricing?.min_price,
        max_price: parsed.maxPrice ?? defaultPricing?.max_price,
        status: 'available' as const
      };
    });

    const { data, error } = await supabase
      .from('product_units')
      .insert(units)
      .select('*');

    if (error) {
      console.error('Error creating product units:', error);
      throw new Error(`Failed to create product units: ${error.message}`);
    }

    return (data || []) as ProductUnit[];
  }

  static async getUnitsForProduct(productId: string): Promise<ProductUnit[]> {
    const { data, error } = await supabase
      .from('product_units')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching product units:', error);
      throw new Error(`Failed to fetch product units: ${error.message}`);
    }

    return (data || []) as ProductUnit[];
  }

  static async updateUnitStatus(
    unitId: string, 
    status: 'available' | 'sold' | 'reserved' | 'damaged'
  ): Promise<ProductUnit> {
    const { data, error } = await supabase
      .from('product_units')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', unitId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating product unit status:', error);
      throw new Error(`Failed to update unit status: ${error.message}`);
    }

    return data as ProductUnit;
  }

  static async deleteUnit(unitId: string): Promise<void> {
    const { error } = await supabase
      .from('product_units')
      .delete()
      .eq('id', unitId);

    if (error) {
      console.error('Error deleting product unit:', error);
      throw new Error(`Failed to delete product unit: ${error.message}`);
    }
  }

  static async getUnitBySerialNumber(serialNumber: string): Promise<ProductUnit | null> {
    const { data, error } = await supabase
      .from('product_units')
      .select('*')
      .eq('serial_number', serialNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching product unit by serial:', error);
      throw new Error(`Failed to fetch unit by serial: ${error.message}`);
    }

    return (data || null) as ProductUnit | null;
  }

  static async getAvailableUnitsForProduct(productId: string): Promise<ProductUnit[]> {
    const { data, error } = await supabase
      .from('product_units')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'available')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching available units:', error);
      throw new Error(`Failed to fetch available units: ${error.message}`);
    }

    return (data || []) as ProductUnit[];
  }

  /**
   * Update existing product units by re-parsing their serial numbers to extract storage/RAM
   * This fixes units created before enhanced parsing was implemented
   */
  static async updateExistingUnitsWithParsedData(): Promise<{ updated: number; errors: number }> {
    let updated = 0;
    let errors = 0;

    try {
      // Get all units with null storage or RAM
      const { data: units, error: fetchError } = await supabase
        .from('product_units')
        .select('id, serial_number, storage, ram')
        .or('storage.is.null,ram.is.null');

      if (fetchError) {
        console.error('Error fetching units to update:', fetchError);
        return { updated, errors: 1 };
      }

      if (!units || units.length === 0) {
        console.log('No units need updating');
        return { updated, errors };
      }

      console.log(`Found ${units.length} units to update`);

      // Process units in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < units.length; i += batchSize) {
        const batch = units.slice(i, i + batchSize);
        
        const updates = batch
          .map(unit => {
            // Re-parse the serial number to extract storage/RAM
            const parsed = parseSerialWithBattery(unit.serial_number);
            
            // Only update if we found new storage or RAM data
            if (parsed.storage || parsed.ram) {
              return {
                id: unit.id,
                storage: parsed.storage,
                ram: parsed.ram,
                updated_at: new Date().toISOString()
              };
            }
            return null;
          })
          .filter(Boolean);

        if (updates.length > 0) {
          for (const update of updates) {
            try {
              const { error: updateError } = await supabase
                .from('product_units')
                .update({
                  storage: update.storage,
                  ram: update.ram,
                  updated_at: update.updated_at
                })
                .eq('id', update.id);

              if (updateError) {
                console.error(`Error updating unit ${update.id}:`, updateError);
                errors++;
              } else {
                updated++;
                console.log(`Updated unit ${update.id} with storage: ${update.storage}GB, RAM: ${update.ram}GB`);
              }
            } catch (err) {
              console.error(`Error updating unit ${update.id}:`, err);
              errors++;
            }
          }
        }
      }

      console.log(`Migration complete: ${updated} units updated, ${errors} errors`);
      return { updated, errors };
    } catch (error) {
      console.error('Error during migration:', error);
      return { updated, errors: errors + 1 };
    }
  }
}