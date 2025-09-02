import { useState, useCallback } from "react";
import { ProductFormData, ProductFormValidationError } from "../types";
import { validateSerialWithBattery } from "@/utils/serialNumberUtils";

export function useProductValidation() {
  const [errors, setErrors] = useState<ProductFormValidationError[]>([]);

  const validateForm = useCallback((data: Partial<ProductFormData>, serialNumbers?: string): ProductFormValidationError[] => {
    const newErrors: ProductFormValidationError[] = [];
    console.log('🔍 Validating form data:', { 
      data, 
      serialNumbers,
      priceType: typeof data.price,
      minPriceType: typeof data.min_price,
      maxPriceType: typeof data.max_price,
      thresholdType: typeof data.threshold
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

    // Price validations with proper number conversion and checks
    const price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
    if (typeof price !== 'number' || isNaN(price) || price < 0) {
      newErrors.push({ field: 'price', message: 'Valid price is required (must be 0 or greater)' });
    }

    const minPrice = typeof data.min_price === 'string' ? parseFloat(data.min_price) : data.min_price;
    if (typeof minPrice !== 'number' || isNaN(minPrice) || minPrice < 0) {
      newErrors.push({ field: 'min_price', message: 'Valid minimum price is required (must be 0 or greater)' });
    }

    const maxPrice = typeof data.max_price === 'string' ? parseFloat(data.max_price) : data.max_price;
    if (typeof maxPrice !== 'number' || isNaN(maxPrice) || maxPrice < 0) {
      newErrors.push({ field: 'max_price', message: 'Valid maximum price is required (must be 0 or greater)' });
    }

    // Threshold validation - allow 0 as valid threshold
    const threshold = typeof data.threshold === 'string' ? parseInt(data.threshold) : data.threshold;
    if (typeof threshold !== 'number' || isNaN(threshold) || threshold < 0) {
      newErrors.push({ field: 'threshold', message: 'Valid threshold is required (must be 0 or greater)' });
    }

    // Min/Max price relationship validation - only validate if both values are present and greater than 0
    if (minPrice !== undefined && maxPrice !== undefined && 
        !isNaN(minPrice) && !isNaN(maxPrice) &&
        minPrice > 0 && maxPrice > 0 &&
        minPrice >= maxPrice) {
      newErrors.push({ field: 'min_price', message: 'Minimum price must be less than maximum price' });
    }

    // Price range validation - only validate if all three values are present, valid, and greater than 0
    if (price !== undefined && minPrice !== undefined && maxPrice !== undefined && 
        !isNaN(price) && !isNaN(minPrice) && !isNaN(maxPrice) &&
        price > 0 && minPrice > 0 && maxPrice > 0) {
      console.log('🔍 Price validation:', { price, min: minPrice, max: maxPrice });
      if (price < minPrice || price > maxPrice) {
        newErrors.push({ field: 'price', message: 'Price must be between minimum and maximum prices' });
      }
    }

    // Serial number validation for categories that require them
    const requiresSerial = data.category_id !== 2; // Accessories are optional
    if (requiresSerial && data.has_serial && serialNumbers) {
      const serialLines = serialNumbers.split('\n').map(line => line.trim()).filter(line => line !== '');
      
      if (serialLines.length === 0) {
        newErrors.push({ field: 'serial_numbers', message: 'This category requires serial numbers' });
      }

      // Validate each serial line format
      for (const line of serialLines) {
        const validation = validateSerialWithBattery(line);
        if (!validation.isValid) {
          newErrors.push({ 
            field: 'serial_numbers', 
            message: `Invalid format in "${line}": ${validation.error}` 
          });
          break; // Only show first error to avoid overwhelming user
        }
      }
    }

    console.log('📋 Validation completed:', { totalErrors: newErrors.length, errors: newErrors });
    
    if (newErrors.length > 0) {
      console.log('❌ Form validation failed with errors:', newErrors.map(e => `${e.field}: ${e.message}`));
    } else {
      console.log('✅ Form validation passed successfully');
    }
    
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