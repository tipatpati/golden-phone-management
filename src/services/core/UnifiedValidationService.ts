/**
 * Unified Validation Service
 * Centralizes all validation logic to eliminate duplication and ensure consistency
 */

import { ProductFormData, UnitEntryForm, InventoryValidationError } from '@/services/inventory/types';
import { validateSerialNumber } from '@/utils/serialNumberUtils';
import { logger } from '@/utils/logger';
import { getCategoryFieldConfig } from '@/utils/categoryUtils';

export interface ValidationContext {
  isUpdate?: boolean;
  allowIncomplete?: boolean;
  validatePricing?: boolean;
}

export interface ValidationRule<T> {
  field: keyof T;
  validate: (value: any, context: T, validationContext?: ValidationContext) => InventoryValidationError | null;
  required?: boolean;
}

export class UnifiedValidationService {
  private static instance: UnifiedValidationService;
  private validationRules: Map<string, ValidationRule<any>[]> = new Map();

  private constructor() {
    this.initializeProductValidationRules();
  }

  static getInstance(): UnifiedValidationService {
    if (!UnifiedValidationService.instance) {
      UnifiedValidationService.instance = new UnifiedValidationService();
    }
    return UnifiedValidationService.instance;
  }

  private initializeProductValidationRules() {
    const productRules: ValidationRule<ProductFormData>[] = [
      {
        field: 'brand',
        required: true,
        validate: (value: string) => {
          if (!value?.trim()) {
            return { field: 'brand', message: 'Brand is required' };
          }
          return null;
        }
      },
      {
        field: 'model',
        required: true,
        validate: (value: string) => {
          if (!value?.trim()) {
            return { field: 'model', message: 'Model is required' };
          }
          return null;
        }
      },
      {
        field: 'category_id',
        required: true,
        validate: (value: number) => {
          if (!value || value < 1) {
            return { field: 'category_id', message: 'Category is required' };
          }
          return null;
        }
      },
      {
        field: 'threshold',
        required: true,
        validate: (value: number) => {
          const threshold = typeof value === 'string' ? parseInt(value) : value;
          if (threshold === undefined || threshold === null || 
              (typeof threshold !== 'number') || isNaN(threshold) || threshold < 0) {
            return { field: 'threshold', message: 'Valid threshold is required (must be 0 or greater)' };
          }
          return null;
        }
      }
    ];

    this.validationRules.set('product', productRules);
  }

  validateProduct(
    data: Partial<ProductFormData>, 
    unitEntries?: UnitEntryForm[], 
    context: ValidationContext = {}
  ): InventoryValidationError[] {
    const errors: InventoryValidationError[] = [];
    
    logger.debug('Unified validation starting', { 
      data, 
      unitEntries, 
      context 
    }, 'UnifiedValidationService');

    // Apply standard field validation rules
    const rules = this.validationRules.get('product') || [];
    for (const rule of rules) {
      const error = rule.validate(data[rule.field], data, context);
      if (error) {
        errors.push(error);
      }
    }

    // Handle serial number validation
    if (data.has_serial) {
      const serialErrors = this.validateSerialNumbers(unitEntries || [], data.category_id, context);
      errors.push(...serialErrors);
    } else {
      const pricingErrors = this.validateNonSerialPricing(data, context);
      errors.push(...pricingErrors);
    }

    // Validate pricing relationships
    const relationshipErrors = this.validatePricingRelationships(data, context);
    errors.push(...relationshipErrors);

    // Validate category-specific requirements
    const categoryErrors = this.validateCategoryRequirements(data, context);
    errors.push(...categoryErrors);

    logger.debug('Unified validation completed', { 
      totalErrors: errors.length, 
      errors 
    }, 'UnifiedValidationService');

    return errors;
  }

  private validateCategoryRequirements(data: Partial<ProductFormData>, context: ValidationContext): InventoryValidationError[] {
    const errors: InventoryValidationError[] = [];
    
    if (!data.category_id) return errors;
    
    const fieldConfig = getCategoryFieldConfig(data.category_id);
    
    // For device categories, validate required specs based on configuration
    if (fieldConfig.requiresDeviceSpecs && data.has_serial) {
      // These validations only apply to products with serial numbers
      // Non-serial products don't need individual unit specs
      if (fieldConfig.fields.storage) {
        // Storage validation is handled at unit level for serial products
      }
      
      if (fieldConfig.fields.ram && data.category_id === 9) {
        // Computers (9) should have RAM specified at unit level
        // This is a soft requirement, just for guidance
      }
    }
    
    return errors;
  }

  private validateSerialNumbers(entries: UnitEntryForm[], categoryId: number | undefined, context: ValidationContext): InventoryValidationError[] {
    const errors: InventoryValidationError[] = [];
    const validEntries = entries.filter(e => (e.serial || '').trim() !== '');

    if (validEntries.length === 0 && !context.allowIncomplete) {
      return errors; // Allow empty during form building
    }

    for (const [idx, entry] of validEntries.entries()) {
      const serialInput = entry.serial || '';
      const numericSerial = serialInput.replace(/\D/g, '');
      
      if (!serialInput.trim()) {
        errors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: IMEI/Serial is required` });
        continue;
      }
      
      // Category-aware serial validation: only enforce 15-digit IMEI for Phones (category 1)
      if (categoryId === 1) {
        if (numericSerial.length !== 15) {
          errors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: IMEI must be exactly 15 digits` });
          continue;
        }
      } else {
        // For other categories (tablets, laptops, computers), use flexible alphanumeric validation
        const validation = validateSerialNumber(serialInput);
        if (!validation.isValid) {
          errors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: ${validation.error}` });
          continue;
        }
      }

      // Validate pricing for serial entries
      const pricingErrors = this.validateUnitPricing(entry, idx + 1);
      errors.push(...pricingErrors);

      // Battery validation
      const battery = entry.battery_level;
      if (battery === undefined || battery === null || isNaN(battery) || 
          battery < 0 || battery > 100 || !Number.isInteger(battery)) {
        errors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: Battery level must be an integer between 0 and 100` });
        continue;
      }
    }

    return errors;
  }

  private validateUnitPricing(entry: UnitEntryForm, unitNumber: number): InventoryValidationError[] {
    const errors: InventoryValidationError[] = [];
    const { price, min_price, max_price } = entry;

    if (price === undefined || price === null || isNaN(price) || price < 0) {
      errors.push({ field: 'serial_numbers', message: `Unit #${unitNumber}: Purchase price is required and must be >= 0` });
      return errors;
    }

    if (min_price === undefined || min_price === null || isNaN(min_price) || min_price <= price) {
      errors.push({ field: 'serial_numbers', message: `Unit #${unitNumber}: Min selling must be a number greater than purchase price` });
      return errors;
    }

    if (max_price === undefined || max_price === null || isNaN(max_price) || max_price <= min_price) {
      errors.push({ field: 'serial_numbers', message: `Unit #${unitNumber}: Max selling must be a number greater than min selling` });
      return errors;
    }

    return errors;
  }

  private validateNonSerialPricing(data: Partial<ProductFormData>, context: ValidationContext): InventoryValidationError[] {
    const errors: InventoryValidationError[] = [];
    
    if (!context.validatePricing) return errors;

    const hasDefaultPrice = (data.price !== undefined && data.price !== null && String(data.price) !== '') ||
                           (data.min_price !== undefined && data.min_price !== null && String(data.min_price) !== '') ||
                           (data.max_price !== undefined && data.max_price !== null && String(data.max_price) !== '');
    
    if (!hasDefaultPrice) {
      errors.push({ field: 'price', message: 'Products without serial numbers require at least one default price (base, min, or max)' });
    }

    return errors;
  }

  private validatePricingRelationships(data: Partial<ProductFormData>, context: ValidationContext): InventoryValidationError[] {
    const errors: InventoryValidationError[] = [];
    
    if (!context.validatePricing) return errors;

    const priceValue = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
    const minPriceValue = typeof data.min_price === 'string' ? parseFloat(data.min_price) : data.min_price;
    const maxPriceValue = typeof data.max_price === 'string' ? parseFloat(data.max_price) : data.max_price;

    if (minPriceValue !== undefined && maxPriceValue !== undefined && 
        !isNaN(minPriceValue) && !isNaN(maxPriceValue) &&
        minPriceValue > 0 && maxPriceValue > 0 &&
        minPriceValue >= maxPriceValue) {
      errors.push({ field: 'min_price', message: 'Minimum price must be less than maximum price' });
    }

    if (priceValue !== undefined && !isNaN(priceValue) && priceValue >= 0) {
      if (minPriceValue !== undefined && !isNaN(minPriceValue) && minPriceValue > 0 && minPriceValue <= priceValue) {
        errors.push({ field: 'min_price', message: 'Default minimum selling price must be greater than default base price' });
      }
      if (maxPriceValue !== undefined && !isNaN(maxPriceValue) && maxPriceValue > 0 && maxPriceValue <= priceValue) {
        errors.push({ field: 'max_price', message: 'Default maximum selling price must be greater than default base price' });
      }
    }

    return errors;
  }

  // Method to add custom validation rules
  addValidationRule<T>(entityType: string, rule: ValidationRule<T>) {
    const rules = this.validationRules.get(entityType) || [];
    rules.push(rule);
    this.validationRules.set(entityType, rules);
  }
}

export const validationService = UnifiedValidationService.getInstance();