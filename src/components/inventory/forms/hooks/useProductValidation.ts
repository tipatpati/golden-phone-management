import { useState, useCallback } from "react";
import { ProductFormData, ProductFormValidationError } from "../types";
import { validateSerialWithBattery } from "@/utils/serialNumberUtils";

export function useProductValidation() {
  const [errors, setErrors] = useState<ProductFormValidationError[]>([]);

  const validateForm = useCallback((data: Partial<ProductFormData>, serialNumbers?: string): ProductFormValidationError[] => {
    const newErrors: ProductFormValidationError[] = [];
    console.log('🔍 Validating form data:', { data, serialNumbers });

    // Required field validations
    if (!data.brand?.trim()) {
      newErrors.push({ field: 'brand', message: 'Brand is required' });
    }

    if (!data.model?.trim()) {
      newErrors.push({ field: 'model', message: 'Model is required' });
    }

    if (!data.category_id || data.category_id === 0) {
      newErrors.push({ field: 'category_id', message: 'Category is required' });
    }

    if (!data.price || data.price <= 0) {
      newErrors.push({ field: 'price', message: 'Valid price is required' });
    }

    if (!data.min_price || data.min_price <= 0) {
      newErrors.push({ field: 'min_price', message: 'Valid minimum price is required' });
    }

    if (!data.max_price || data.max_price <= 0) {
      newErrors.push({ field: 'max_price', message: 'Valid maximum price is required' });
    }

    if (data.threshold === undefined || data.threshold === null || data.threshold < 0) {
      newErrors.push({ field: 'threshold', message: 'Valid threshold is required' });
    }

    // Min/Max price relationship validation - only validate if both values are present
    if (data.min_price && data.max_price && 
        typeof data.min_price === 'number' && typeof data.max_price === 'number' &&
        data.min_price >= data.max_price) {
      newErrors.push({ field: 'min_price', message: 'Minimum price must be less than maximum price' });
    }

    // Price range validation - only validate if all three values are present and valid
    if (data.price && data.min_price && data.max_price && 
        typeof data.price === 'number' && typeof data.min_price === 'number' && typeof data.max_price === 'number') {
      console.log('🔍 Price validation:', { price: data.price, min: data.min_price, max: data.max_price });
      if (data.price < data.min_price || data.price > data.max_price) {
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