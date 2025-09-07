import { useState, useCallback } from "react";
import type { ProductFormData, ProductFormValidationError, UnitEntryForm } from "@/services/inventory/types";
import { validateSerialWithBattery } from "@/utils/serialNumberUtils";

export function useProductValidation() {
  const [errors, setErrors] = useState<ProductFormValidationError[]>([]);

  const validateForm = useCallback((data: Partial<ProductFormData>, unitEntries?: UnitEntryForm[]): ProductFormValidationError[] => {
    const newErrors: ProductFormValidationError[] = [];
    console.log('🔍 VALIDATION START - Validating form data:', { 
      data,
      unitEntries,
      brand: data.brand,
      model: data.model,
      category_id: data.category_id,
      price: data.price,
      min_price: data.min_price,
      max_price: data.max_price,
      threshold: data.threshold,
      has_serial: data.has_serial
    });

    // Required field validations
    if (!data.brand?.trim()) {
      newErrors.push({ field: 'brand', message: 'Brand is required' });
    }

    if (!data.model?.trim()) {
      newErrors.push({ field: 'model', message: 'Model is required' });
    }

    // Category validation - ensure it's a valid category ID (1-4)
    if (!data.category_id || data.category_id < 1 || data.category_id > 4) {
      newErrors.push({ field: 'category_id', message: 'Category is required' });
    }

    // For products with serial numbers, unit entries must include structured pricing
    if (data.has_serial) {
      const entries = (unitEntries || []).filter(e => (e.serial || '').trim() !== '');

      if (entries.length === 0) {
        newErrors.push({ field: 'serial_numbers', message: 'Please add at least one unit with its IMEI/Serial' });
      }

      // Validate each entry
      for (const [idx, entry] of entries.entries()) {
        // IMEI validation - must be exactly 15 digits
        const serialInput = entry.serial || '';
        const numericSerial = serialInput.replace(/\D/g, '');
        
        if (!serialInput.trim()) {
          newErrors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: IMEI/Serial is required` });
          break;
        }
        
        if (numericSerial.length !== 15) {
          newErrors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: IMEI must be exactly 15 digits` });
          break;
        }

        // Pricing rules
        const price = entry.price;
        const minPrice = entry.min_price;
        const maxPrice = entry.max_price;

        if (price === undefined || price === null || isNaN(price) || price < 0) {
          newErrors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: Purchase price is required and must be >= 0` });
          break;
        }
        if (minPrice === undefined || minPrice === null || isNaN(minPrice) || minPrice <= price) {
          newErrors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: Min selling must be a number greater than purchase price` });
          break;
        }
        if (maxPrice === undefined || maxPrice === null || isNaN(maxPrice) || maxPrice <= minPrice) {
          newErrors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: Max selling must be a number greater than min selling` });
          break;
        }

        // Battery level integer 0-100 (required)
        const battery = entry.battery_level;
        if (battery === undefined || battery === null || isNaN(battery) || battery < 0 || battery > 100 || !Number.isInteger(battery)) {
          newErrors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: Battery level must be an integer between 0 and 100` });
          break;
        }

        // Optional: We can still run a lightweight serial validation if utility exists
        const basicValidation = validateSerialWithBattery(entry.serial + '');
        if (!basicValidation.isValid && entry.serial.length < 10) {
          // Only flag obviously invalid very short serials
          newErrors.push({ field: 'serial_numbers', message: `Unit #${idx + 1}: Serial appears invalid` });
          break;
        }
      }
    } else {
      // For products without serial numbers, require at least one default price
      const hasDefaultPrice = (data.price !== undefined && data.price !== null && String(data.price) !== '') ||
                              (data.min_price !== undefined && data.min_price !== null && String(data.min_price) !== '') ||
                              (data.max_price !== undefined && data.max_price !== null && String(data.max_price) !== '');
      
      if (!hasDefaultPrice) {
        newErrors.push({ field: 'price', message: 'Products without serial numbers require at least one default price (base, min, or max)' });
      }
    }

    // Price validations when default values are provided
    if (data.price !== undefined && data.price !== null && String(data.price) !== '') {
      const price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
      if ((typeof price !== 'number') || isNaN(price) || price < 0) {
        newErrors.push({ field: 'price', message: 'Valid default price is required (must be 0 or greater)' });
      }
    }

    if (data.min_price !== undefined && data.min_price !== null && String(data.min_price) !== '') {
      const minPrice = typeof data.min_price === 'string' ? parseFloat(data.min_price) : data.min_price;
      if ((typeof minPrice !== 'number') || isNaN(minPrice) || minPrice < 0) {
        newErrors.push({ field: 'min_price', message: 'Valid default minimum price is required (must be 0 or greater)' });
      }
    }

    if (data.max_price !== undefined && data.max_price !== null && String(data.max_price) !== '') {
      const maxPrice = typeof data.max_price === 'string' ? parseFloat(data.max_price) : data.max_price;
      if ((typeof maxPrice !== 'number') || isNaN(maxPrice) || maxPrice < 0) {
        newErrors.push({ field: 'max_price', message: 'Valid default maximum price is required (must be 0 or greater)' });
      }
    }

    // Threshold validation - allow 0 as valid threshold
    const threshold = typeof data.threshold === 'string' ? parseInt(data.threshold) : data.threshold;
    if (threshold === undefined || threshold === null || (typeof threshold !== 'number') || isNaN(threshold) || threshold < 0) {
      newErrors.push({ field: 'threshold', message: 'Valid threshold is required (must be 0 or greater)' });
    }

    // Default pricing relationships
    const priceValue = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
    const minPriceValue = typeof data.min_price === 'string' ? parseFloat(data.min_price) : data.min_price;
    const maxPriceValue = typeof data.max_price === 'string' ? parseFloat(data.max_price) : data.max_price;

    if (minPriceValue !== undefined && maxPriceValue !== undefined && 
        !isNaN(minPriceValue) && !isNaN(maxPriceValue) &&
        minPriceValue > 0 && maxPriceValue > 0 &&
        minPriceValue >= maxPriceValue) {
      newErrors.push({ field: 'min_price', message: 'Minimum price must be less than maximum price' });
    }

    if (priceValue !== undefined && !isNaN(priceValue) && priceValue >= 0) {
      if (minPriceValue !== undefined && !isNaN(minPriceValue) && minPriceValue > 0 && minPriceValue <= priceValue) {
        newErrors.push({ field: 'min_price', message: 'Default minimum selling price must be greater than default base price' });
      }
      if (maxPriceValue !== undefined && !isNaN(maxPriceValue) && maxPriceValue > 0 && maxPriceValue <= priceValue) {
        newErrors.push({ field: 'max_price', message: 'Default maximum selling price must be greater than default base price' });
      }
    }

    console.log('📋 Validation completed:', { totalErrors: newErrors.length, errors: newErrors });
    setErrors(newErrors);
    return newErrors;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const getFieldError = useCallback((field: string) => {
    return errors.find(error => error.field === field)?.message;
  }, [errors]);

  const hasErrors = errors.length > 0;

  return {
    errors,
    validateForm,
    clearErrors,
    getFieldError,
    hasErrors
  };
}