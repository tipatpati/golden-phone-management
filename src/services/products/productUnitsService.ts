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
  storage?: string; // e.g., 64GB, 128GB
  status: 'available' | 'sold' | 'reserved' | 'damaged';
  created_at: string;
  updated_at: string;
}

export interface CreateProductUnitData {
  product_id: string;
  serial_number: string;
  color?: string;
  battery_level?: number;
  storage?: string;
  status?: 'available' | 'sold' | 'reserved' | 'damaged';
}

export class ProductUnitsService {
  static async createUnitsForProduct(
    productId: string, 
    serialNumbers: string[]
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
}