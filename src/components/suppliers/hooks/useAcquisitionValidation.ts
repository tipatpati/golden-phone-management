import { useMemo, useState, useCallback } from 'react';
import { z } from 'zod';
import type { AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';
import type { ProductFormData, UnitEntryForm } from '@/services/inventory/types';

// ============= VALIDATION SCHEMAS =============

const productDataSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  category_id: z.number().min(1, 'Category is required'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  min_price: z.number().min(0, 'Min price must be 0 or greater'),
  max_price: z.number().min(0, 'Max price must be 0 or greater'),
  threshold: z.number().min(0, 'Threshold must be 0 or greater'),
  has_serial: z.boolean(),
  year: z.number().nullable().optional(),
  description: z.string().optional(),
  supplier: z.string().optional(),
  stock: z.number().min(0, 'Stock must be 0 or greater'),
});

const unitEntrySchema = z.object({
  serial: z.string().min(1, 'Serial number/IMEI is required'),
  price: z.number().min(0.01, 'Price must be greater than 0').optional(),
  min_price: z.number().min(0, 'Min price must be 0 or greater').optional(),
  max_price: z.number().min(0, 'Max price must be 0 or greater').optional(),
  battery_level: z.number().min(0).max(100, 'Battery level must be between 0-100').optional(),
  color: z.string().optional(),
  storage: z.number().min(0, 'Storage must be 0 or greater').optional(),
  ram: z.number().min(0, 'RAM must be 0 or greater').optional(),
  condition: z.enum(['new', 'used']).optional(),
  supplier_id: z.string().optional(),
});

const acquisitionItemSchema = z.object({
  createsNewProduct: z.boolean(),
  productId: z.string().optional(),
  productData: productDataSchema.optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0.01, 'Unit cost must be greater than 0'),
  unitEntries: z.array(unitEntrySchema).optional(),
}).refine((item) => {
  // Validate based on item type
  if (item.createsNewProduct) {
    return item.productData !== undefined;
  } else {
    return item.productId && item.productId.length > 0;
  }
}, {
  message: 'Product selection or data is required',
  path: ['productId']
});

// ============= VALIDATION ERROR TYPES =============

export interface ValidationError {
  field: string;
  message: string;
  itemIndex?: number;
  unitIndex?: number;
}

export interface ItemValidationSummary {
  isValid: boolean;
  errors: ValidationError[];
  hasRequiredFieldErrors: boolean;
  hasPricingErrors: boolean;
  hasSerialErrors: boolean;
}

// ============= VALIDATION HOOK =============

export function useAcquisitionValidation() {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateItem = useCallback((item: AcquisitionItem, itemIndex: number): ItemValidationSummary => {
    const errors: ValidationError[] = [];
    let hasRequiredFieldErrors = false;
    let hasPricingErrors = false;
    let hasSerialErrors = false;

    try {
      // Validate basic item structure
      acquisitionItemSchema.parse(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          const field = err.path.join('.');
          const message = err.message;
          
          errors.push({
            field,
            message,
            itemIndex
          });

          // Categorize error types
          if (['productId', 'productData.brand', 'productData.model', 'quantity', 'unitCost'].includes(field)) {
            hasRequiredFieldErrors = true;
          }
          if (field.includes('price') || field === 'unitCost') {
            hasPricingErrors = true;
          }
        });
      }
    }

    // Additional validation for new products
    if (item.createsNewProduct && item.productData) {
      try {
        productDataSchema.parse(item.productData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            const field = `productData.${err.path.join('.')}`;
            errors.push({
              field,
              message: err.message,
              itemIndex
            });

            if (['brand', 'model', 'category_id', 'price'].includes(err.path[0] as string)) {
              hasRequiredFieldErrors = true;
            }
            if (err.path[0] === 'price' || err.path.join('.').includes('price')) {
              hasPricingErrors = true;
            }
          });
        }
      }

      // Validate unit entries for serialized products
      if (item.productData.has_serial) {
        if (!item.unitEntries || item.unitEntries.length === 0) {
          errors.push({
            field: 'unitEntries',
            message: 'Serial numbers are required for this product',
            itemIndex
          });
          hasSerialErrors = true;
        } else {
          item.unitEntries.forEach((unit, unitIndex) => {
            try {
              unitEntrySchema.parse(unit);
            } catch (error) {
              if (error instanceof z.ZodError) {
                error.errors.forEach(err => {
                  const field = `unitEntries.${unitIndex}.${err.path.join('.')}`;
                  errors.push({
                    field,
                    message: err.message,
                    itemIndex,
                    unitIndex
                  });

                  if (err.path[0] === 'serial') {
                    hasSerialErrors = true;
                  }
                  if (err.path.join('.').includes('price')) {
                    hasPricingErrors = true;
                  }
                });
              }
            }
          });

          // Check for duplicate serial numbers within the item
          const serials = item.unitEntries.map(u => u.serial.trim().toLowerCase()).filter(s => s);
          const duplicates = serials.filter((serial, index) => serials.indexOf(serial) !== index);
          
          if (duplicates.length > 0) {
            errors.push({
              field: 'unitEntries',
              message: `Duplicate serial numbers found: ${duplicates.join(', ')}`,
              itemIndex
            });
            hasSerialErrors = true;
          }
        }
      }
    }

    // Validate existing product selection
    if (!item.createsNewProduct) {
      if (!item.productId) {
        errors.push({
          field: 'productId',
          message: 'Product selection is required',
          itemIndex
        });
        hasRequiredFieldErrors = true;
      }

      if (item.unitCost <= 0) {
        errors.push({
          field: 'unitCost',
          message: 'Unit cost must be greater than 0',
          itemIndex
        });
        hasPricingErrors = true;
      }

      if (item.quantity <= 0) {
        errors.push({
          field: 'quantity',
          message: 'Quantity must be at least 1',
          itemIndex
        });
        hasRequiredFieldErrors = true;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      hasRequiredFieldErrors,
      hasPricingErrors,
      hasSerialErrors
    };
  }, []);

  const validateAllItems = useCallback((items: AcquisitionItem[]) => {
    const allErrors: ValidationError[] = [];
    const itemSummaries: ItemValidationSummary[] = [];

    items.forEach((item, index) => {
      const summary = validateItem(item, index);
      itemSummaries.push(summary);
      allErrors.push(...summary.errors);
    });

    // Check for duplicate serial numbers across all items
    const allSerials = items.flatMap((item, itemIndex) => 
      (item.unitEntries || []).map((unit, unitIndex) => ({
        serial: unit.serial?.trim().toLowerCase(),
        itemIndex,
        unitIndex
      }))
    ).filter(entry => entry.serial);

    const serialMap = new Map<string, { itemIndex: number; unitIndex: number }[]>();
    allSerials.forEach(entry => {
      if (!serialMap.has(entry.serial!)) {
        serialMap.set(entry.serial!, []);
      }
      serialMap.get(entry.serial!)!.push({ itemIndex: entry.itemIndex, unitIndex: entry.unitIndex });
    });

    serialMap.forEach((occurrences, serial) => {
      if (occurrences.length > 1) {
        occurrences.forEach(({ itemIndex, unitIndex }) => {
          allErrors.push({
            field: `unitEntries.${unitIndex}.serial`,
            message: `Serial number "${serial}" is used multiple times across items`,
            itemIndex,
            unitIndex
          });
        });
      }
    });

    setValidationErrors(allErrors);
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      itemSummaries,
      totalErrors: allErrors.length,
      hasRequiredFieldErrors: itemSummaries.some(s => s.hasRequiredFieldErrors),
      hasPricingErrors: itemSummaries.some(s => s.hasPricingErrors),
      hasSerialErrors: itemSummaries.some(s => s.hasSerialErrors)
    };
  }, [validateItem]);

  const getItemErrors = useCallback((itemIndex: number) => {
    return validationErrors.filter(error => error.itemIndex === itemIndex);
  }, [validationErrors]);

  const getFieldError = useCallback((itemIndex: number, field: string) => {
    const error = validationErrors.find(
      error => error.itemIndex === itemIndex && error.field === field
    );
    return error?.message;
  }, [validationErrors]);

  const clearErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  const scrollToFirstError = useCallback(() => {
    if (validationErrors.length === 0) return;

    const firstError = validationErrors[0];
    let elementId: string;

    if (firstError.itemIndex !== undefined) {
      if (firstError.field.includes('unitEntries')) {
        // For unit entry errors, scroll to the unit management section
        elementId = `item-${firstError.itemIndex}-unit-management`;
      } else {
        // For general item errors, scroll to the item
        elementId = `acquisition-item-${firstError.itemIndex}`;
      }
    } else {
      // For form-level errors, scroll to the form
      elementId = 'acquisition-form';
    }

    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Add visual highlight
      element.classList.add('ring-2', 'ring-destructive', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-destructive', 'ring-offset-2');
      }, 3000);
    }
  }, [validationErrors]);

  return {
    validateItem,
    validateAllItems,
    getItemErrors,
    getFieldError,
    clearErrors,
    scrollToFirstError,
    validationErrors,
    hasErrors: validationErrors.length > 0
  };
}