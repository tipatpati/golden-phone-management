import { useState, useCallback } from "react";
import { ProductFormData, ProductFormValidationError } from "../types";
import { validateSerialWithBattery } from "@/utils/serialNumberUtils";

export function useProductValidation() {
  const [errors, setErrors] = useState<ProductFormValidationError[]>([]);

  const validateForm = useCallback((data: Partial<ProductFormData>, serialNumbers?: string): ProductFormValidationError[] => {
    const newErrors: ProductFormValidationError[] = [];
    console.log('🔍 VALIDATION START - Validating form data:', { 
      data, 
      serialNumbers,
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
      console.log('❌ Brand validation failed:', data.brand);
      newErrors.push({ field: 'brand', message: 'Brand is required' });
    }

    if (!data.model?.trim()) {
      console.log('❌ Model validation failed:', data.model);
      newErrors.push({ field: 'model', message: 'Model is required' });
    }

    // Category validation - ensure it's a valid category ID (1-4)
    if (!data.category_id || data.category_id < 1 || data.category_id > 4) {
      console.log('❌ Category validation failed:', data.category_id);
      newErrors.push({ field: 'category_id', message: 'Category is required' });
    }

    // For products with serial numbers, individual unit pricing is required
    // For products without serial numbers, at least one default price is required
    if (data.has_serial && serialNumbers) {
      const serialLines = serialNumbers.split('\n').map(line => line.trim()).filter(line => line !== '');
      
      // Check if any unit has pricing information - look for specific pricing patterns
      const hasUnitPricing = serialLines.some(line => {
        // Check for any of the price patterns: price:X, minPrice:X, maxPrice:X (case insensitive)
        return /price:\s*\d+(\.\d+)?/i.test(line) || 
               /minprice:\s*\d+(\.\d+)?/i.test(line) || 
               /maxprice:\s*\d+(\.\d+)?/i.test(line);
      });
      
      console.log('🔍 Unit pricing validation:', { 
        serialLines, 
        hasUnitPricing,
        sampleChecks: serialLines.slice(0, 3).map(line => ({
          line,
          hasPrice: /price:\s*\d+(\.\d+)?/i.test(line),
          hasMinPrice: /minprice:\s*\d+(\.\d+)?/i.test(line),
          hasMaxPrice: /maxprice:\s*\d+(\.\d+)?/i.test(line)
        }))
      });
      
      if (serialLines.length > 0 && !hasUnitPricing) {
        newErrors.push({ 
          field: 'serial_numbers', 
          message: 'Products with serial numbers require unit-level pricing. Add price:value to each serial number line.' 
        });
      }
    } else if (!data.has_serial) {
      // For products without serial numbers, require at least one default price
      const hasDefaultPrice = (data.price !== undefined && data.price !== null && String(data.price) !== '') ||
                             (data.min_price !== undefined && data.min_price !== null && String(data.min_price) !== '') ||
                             (data.max_price !== undefined && data.max_price !== null && String(data.max_price) !== '');
      
      if (!hasDefaultPrice) {
        newErrors.push({ field: 'price', message: 'Products without serial numbers require at least one default price (base, min, or max)' });
      }
    }

    // Price validations when values are provided
    if (data.price !== undefined && data.price !== null && String(data.price) !== '') {
      const price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
      console.log('🔍 Price validation:', { original: data.price, converted: price, type: typeof price });
      if ((typeof price !== 'number') || isNaN(price) || price < 0) {
        console.log('❌ Price validation failed:', { price, type: typeof price, isNaN: isNaN(price as number) });
        newErrors.push({ field: 'price', message: 'Valid default price is required (must be 0 or greater)' });
      }
    }

    if (data.min_price !== undefined && data.min_price !== null && String(data.min_price) !== '') {
      const minPrice = typeof data.min_price === 'string' ? parseFloat(data.min_price) : data.min_price;
      console.log('🔍 Min price validation:', { original: data.min_price, converted: minPrice, type: typeof minPrice });
      if ((typeof minPrice !== 'number') || isNaN(minPrice) || minPrice < 0) {
        console.log('❌ Min price validation failed:', { minPrice, type: typeof minPrice, isNaN: isNaN(minPrice as number) });
        newErrors.push({ field: 'min_price', message: 'Valid default minimum price is required (must be 0 or greater)' });
      }
    }

    if (data.max_price !== undefined && data.max_price !== null && String(data.max_price) !== '') {
      const maxPrice = typeof data.max_price === 'string' ? parseFloat(data.max_price) : data.max_price;
      console.log('🔍 Max price validation:', { original: data.max_price, converted: maxPrice, type: typeof maxPrice });
      if ((typeof maxPrice !== 'number') || isNaN(maxPrice) || maxPrice < 0) {
        console.log('❌ Max price validation failed:', { maxPrice, type: typeof maxPrice, isNaN: isNaN(maxPrice as number) });
        newErrors.push({ field: 'max_price', message: 'Valid default maximum price is required (must be 0 or greater)' });
      }
    }

    // Threshold validation - allow 0 as valid threshold
    const threshold = typeof data.threshold === 'string' ? parseInt(data.threshold) : data.threshold;
    console.log('🔍 Threshold validation:', { original: data.threshold, converted: threshold, type: typeof threshold });
    if (threshold === undefined || threshold === null || (typeof threshold !== 'number') || isNaN(threshold) || threshold < 0) {
      console.log('❌ Threshold validation failed:', { threshold, type: typeof threshold, isNaN: isNaN(threshold as number) });
      newErrors.push({ field: 'threshold', message: 'Valid threshold is required (must be 0 or greater)' });
    }

    // Validate price relationships when all values are present
    const priceValue = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
    const minPriceValue = typeof data.min_price === 'string' ? parseFloat(data.min_price) : data.min_price;
    const maxPriceValue = typeof data.max_price === 'string' ? parseFloat(data.max_price) : data.max_price;

    // Min/Max price relationship validation
    if (minPriceValue !== undefined && maxPriceValue !== undefined && 
        !isNaN(minPriceValue) && !isNaN(maxPriceValue) &&
        minPriceValue > 0 && maxPriceValue > 0 &&
        minPriceValue >= maxPriceValue) {
      newErrors.push({ field: 'min_price', message: 'Minimum price must be less than maximum price' });
    }

    // Default pricing relationship validation when all prices are set
    if (priceValue !== undefined && !isNaN(priceValue) && priceValue >= 0) {
      if (minPriceValue !== undefined && !isNaN(minPriceValue) && minPriceValue > 0 && minPriceValue <= priceValue) {
        newErrors.push({ field: 'min_price', message: 'Default minimum selling price must be greater than default base price' });
      }
      if (maxPriceValue !== undefined && !isNaN(maxPriceValue) && maxPriceValue > 0 && maxPriceValue <= priceValue) {
        newErrors.push({ field: 'max_price', message: 'Default maximum selling price must be greater than default base price' });
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