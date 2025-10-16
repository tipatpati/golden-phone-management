import { supabase } from '@/integrations/supabase/client';

export interface ReassignmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ProductReassignmentService {
  /**
   * Validate if a unit can be reassigned to a different product
   */
  static async validateReassignment(
    unitId: string,
    currentProductId: string,
    newProductId: string,
    serialNumber: string
  ): Promise<ReassignmentValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if it's the same product
    if (currentProductId === newProductId) {
      errors.push('Unit is already assigned to this product');
      return { isValid: false, errors, warnings };
    }

    // Get unit details
    const { data: unit, error: unitError } = await supabase
      .from('product_units')
      .select('status')
      .eq('id', unitId)
      .single();

    if (unitError || !unit) {
      errors.push('Unit not found');
      return { isValid: false, errors, warnings };
    }

    // Check if unit is sold
    if (unit.status === 'sold') {
      errors.push('Cannot reassign sold units. Unit must be in available, damaged, or reserved status.');
      return { isValid: false, errors, warnings };
    }

    // Get target product details
    const { data: targetProduct, error: productError } = await supabase
      .from('products')
      .select('has_serial, brand, model')
      .eq('id', newProductId)
      .single();

    if (productError || !targetProduct) {
      errors.push('Target product not found');
      return { isValid: false, errors, warnings };
    }

    // Check if target product accepts serialized units
    if (!targetProduct.has_serial) {
      errors.push(`Target product (${targetProduct.brand} ${targetProduct.model}) does not accept serialized units`);
      return { isValid: false, errors, warnings };
    }

    // Check for duplicate serial number in target product
    const { data: duplicateUnit } = await supabase
      .from('product_units')
      .select('id')
      .eq('product_id', newProductId)
      .eq('serial_number', serialNumber)
      .single();

    if (duplicateUnit) {
      errors.push('A unit with this serial number already exists in the target product');
      return { isValid: false, errors, warnings };
    }

    // Check if unit has sales history
    const { data: salesHistory } = await supabase
      .from('sold_product_units')
      .select('id')
      .eq('product_unit_id', unitId)
      .limit(1);

    if (salesHistory && salesHistory.length > 0) {
      warnings.push('This unit has sales history. Reassignment will be logged for audit purposes.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
