import type { ProductUnit } from "@/services/inventory/types";
import { ProductForLabels, ValidationResult } from "./types";

export class LabelDataValidator {
  /**
   * Validate that a product unit has all required data for thermal labels
   */
  static validateUnit(unit: ProductUnit): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Critical validations
    if (!unit.barcode) {
      errors.push(`Unit ${unit.serial_number} missing barcode`);
    }

    if (!unit.serial_number) {
      errors.push(`Unit ${unit.id} missing serial number`);
    }

    // Warning validations
    if (!unit.storage && !unit.ram) {
      warnings.push(`Unit ${unit.serial_number} missing storage and RAM data`);
    } else if (!unit.storage) {
      warnings.push(`Unit ${unit.serial_number} missing storage data`);
    } else if (!unit.ram) {
      warnings.push(`Unit ${unit.serial_number} missing RAM data`);
    }

    if (!unit.price) {
      warnings.push(`Unit ${unit.serial_number} missing price data`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a product for label generation
   */
  static validateProduct(product: ProductForLabels): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!product.brand || !product.model) {
      errors.push(`Product ${product.id} missing brand or model`);
    }

    if (!product.price && !product.max_price) {
      warnings.push(`Product ${product.id} missing price data`);
    }

    if (product.serial_numbers && product.serial_numbers.length > 0 && !product.storage && !product.ram) {
      warnings.push(`Product ${product.id} with serial numbers missing storage/RAM defaults`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate an array of units and return detailed report
   */
  static validateUnits(units: ProductUnit[]): ValidationResult & { 
    validUnits: ProductUnit[];
    invalidUnits: ProductUnit[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validUnits: ProductUnit[] = [];
    const invalidUnits: ProductUnit[] = [];

    for (const unit of units) {
      const result = this.validateUnit(unit);
      
      if (result.isValid) {
        validUnits.push(unit);
      } else {
        invalidUnits.push(unit);
      }

      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    return {
      isValid: validUnits.length > 0,
      errors,
      warnings,
      validUnits,
      invalidUnits
    };
  }
}