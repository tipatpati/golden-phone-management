/**
 * Optimized Validation Hook
 * Reduces re-renders and improves performance through memoization and debouncing
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { debounce } from 'lodash-es';
import { validationService, ValidationContext } from '@/services/core/UnifiedValidationService';
import { ProductFormData, UnitEntryForm, InventoryValidationError } from '@/services/inventory/types';
import { logger } from '@/utils/logger';

export interface UseOptimizedValidationOptions {
  debounceMs?: number;
  validateOnChange?: boolean;
  validationContext?: ValidationContext;
}

export function useOptimizedValidation(options: UseOptimizedValidationOptions = {}) {
  const {
    debounceMs = 300,
    validateOnChange = true,
    validationContext = {}
  } = options;

  const [errors, setErrors] = useState<InventoryValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const validationRef = useRef<{ lastValidation: number; abortController?: AbortController }>({
    lastValidation: 0
  });

  // Debounced validation function
  const debouncedValidate = useMemo(
    () => debounce(async (
      data: Partial<ProductFormData>, 
      unitEntries?: UnitEntryForm[],
      context?: ValidationContext
    ) => {
      const validationId = Date.now();
      validationRef.current.lastValidation = validationId;
      
      // Cancel previous validation if still running
      if (validationRef.current.abortController) {
        validationRef.current.abortController.abort();
      }
      
      const abortController = new AbortController();
      validationRef.current.abortController = abortController;

      try {
        setIsValidating(true);
        
        // Only proceed if this is still the latest validation request
        if (validationRef.current.lastValidation === validationId && !abortController.signal.aborted) {
          const validationErrors = validationService.validateProduct(
            data, 
            unitEntries, 
            { ...validationContext, ...context }
          );
          
          if (!abortController.signal.aborted) {
            setErrors(validationErrors);
            logger.debug('Optimized validation completed', { 
              errorCount: validationErrors.length,
              validationId 
            }, 'useOptimizedValidation');
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          logger.error('Validation error', error, 'useOptimizedValidation');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsValidating(false);
        }
      }
    }, debounceMs),
    [debounceMs, validationContext]
  );

  // Immediate validation for form submission
  const validateImmediately = useCallback(async (
    data: Partial<ProductFormData>, 
    unitEntries?: UnitEntryForm[],
    context?: ValidationContext
  ): Promise<InventoryValidationError[]> => {
    // Cancel any pending debounced validation
    debouncedValidate.cancel();
    
    setIsValidating(true);
    try {
      const validationErrors = validationService.validateProduct(
        data, 
        unitEntries, 
        { ...validationContext, ...context }
      );
      
      setErrors(validationErrors);
      logger.debug('Immediate validation completed', { 
        errorCount: validationErrors.length 
      }, 'useOptimizedValidation');
      
      return validationErrors;
    } finally {
      setIsValidating(false);
    }
  }, [validationContext, debouncedValidate]);

  // Field-level validation
  const validateField = useCallback((
    field: keyof ProductFormData,
    value: any,
    data: Partial<ProductFormData>
  ) => {
    if (!validateOnChange) return;
    
    const updatedData = { ...data, [field]: value };
    debouncedValidate(updatedData);
  }, [debouncedValidate, validateOnChange]);

  // Get error for specific field
  const getFieldError = useCallback((field: string) => {
    return errors.find(error => error.field === field)?.message;
  }, [errors]);

  // Check if form has errors
  const hasErrors = useMemo(() => errors.length > 0, [errors]);

  // Clear errors
  const clearErrors = useCallback(() => {
    debouncedValidate.cancel();
    setErrors([]);
    setIsValidating(false);
  }, [debouncedValidate]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    debouncedValidate.cancel();
    if (validationRef.current.abortController) {
      validationRef.current.abortController.abort();
    }
  }, [debouncedValidate]);

  return {
    errors,
    isValidating,
    hasErrors,
    validateField,
    validateImmediately,
    getFieldError,
    clearErrors,
    cleanup
  };
}