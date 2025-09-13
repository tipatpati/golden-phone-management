/**
 * Enhanced Form Validation Hook
 * Integrates with UnifiedValidationService for consistent validation
 */

import { useState, useCallback, useMemo } from 'react';
import { validationService } from '@/services/core/UnifiedValidationService';
import { dataSanitizer } from '@/security/DataSanitizer';
import { useErrorHandler } from './useErrorHandler';
import { ValidationResult, ValidationError, FieldChangeHandler } from '@/types/global';
import { logger } from '@/utils/secureLogger';

interface UseFormValidationOptions<T> {
  initialData?: Partial<T>;
  validationRules?: Record<keyof T, any>;
  sanitizeOnChange?: boolean;
  validateOnChange?: boolean;
  debounceMs?: number;
  context?: string;
}

interface FormValidationState<T> {
  data: Partial<T>;
  errors: Record<keyof T, string>;
  isValid: boolean;
  isDirty: boolean;
  isValidating: boolean;
  touchedFields: Set<keyof T>;
}

export function useFormValidation<T extends Record<string, any>>(
  options: UseFormValidationOptions<T> = {}
) {
  const {
    initialData = {} as Partial<T>,
    sanitizeOnChange = true,
    validateOnChange = true,
    context = 'FormValidation'
  } = options;

  const { handleError } = useErrorHandler({ context });

  const [state, setState] = useState<FormValidationState<T>>({
    data: initialData,
    errors: {} as Record<keyof T, string>,
    isValid: true,
    isDirty: false,
    isValidating: false,
    touchedFields: new Set()
  });

  // Field change handler with sanitization and validation
  const handleFieldChange: FieldChangeHandler<T> = useCallback(async (field, value) => {
    try {
      // Sanitize input if enabled
      let sanitizedValue = value;
      if (sanitizeOnChange && typeof value === 'string') {
        sanitizedValue = dataSanitizer.sanitizeInput(value) as any;
      }

      // Update data with proper typing
      setState(prev => ({
        ...prev,
        data: { ...prev.data, [field]: sanitizedValue as any },
        isDirty: true,
        touchedFields: new Set([...prev.touchedFields, field])
      }));

      // Validate field if enabled
      if (validateOnChange) {
        await validateField(field, sanitizedValue);
      }

      logger.debug('Field changed', { field, hasValue: !!value }, context);
    } catch (error) {
      handleError(error, `Failed to update field: ${String(field)}`);
    }
  }, [sanitizeOnChange, validateOnChange, context, handleError]);

  // Validate single field
  const validateField = useCallback(async (field: keyof T, value?: any) => {
    try {
      setState(prev => ({ ...prev, isValidating: true }));

      const fieldValue = value !== undefined ? value : state.data[field];
      
      // Create validation context based on field type
      const validationContext = {
        field: String(field),
        value: fieldValue,
        allData: state.data
      };

      // Use appropriate validation method based on field name or type
      let validationResult: ValidationResult;

      // Field-specific validation logic
      if (String(field).includes('email')) {
        validationResult = { 
          isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(fieldValue || '')),
          errors: []
        };
      } else if (String(field).includes('phone')) {
        validationResult = {
          isValid: /^[\d+\-\s()]+$/.test(String(fieldValue || '')),
          errors: []
        };
      } else if (String(field).includes('price') || String(field).includes('amount')) {
        const num = Number(fieldValue);
        validationResult = {
          isValid: !isNaN(num) && num >= 0,
          errors: []
        };
      } else {
        // Default validation
        validationResult = {
          isValid: fieldValue !== undefined && fieldValue !== '',
          errors: []
        };
      }

      // Update field error
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: validationResult.isValid ? '' : (validationResult.errors[0]?.message || 'Invalid value')
        },
        isValidating: false
      }));

      return validationResult;
    } catch (error) {
      setState(prev => ({ ...prev, isValidating: false }));
      handleError(error, `Failed to validate field: ${String(field)}`);
      return { isValid: false, errors: [] };
    }
  }, [state.data, context, handleError]);

  // Validate entire form
  const validateForm = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isValidating: true }));

      const errors: Record<keyof T, string> = {} as Record<keyof T, string>;
      let isFormValid = true;

      // Validate all fields
      for (const [field, value] of Object.entries(state.data)) {
        const result = await validateField(field as keyof T, value);
        if (!result.isValid) {
          errors[field as keyof T] = result.errors[0]?.message || 'Invalid value';
          isFormValid = false;
        }
      }

      setState(prev => ({
        ...prev,
        errors,
        isValid: isFormValid,
        isValidating: false
      }));

      logger.debug('Form validation completed', { isValid: isFormValid, errorCount: Object.keys(errors).length }, context);

      return { isValid: isFormValid, errors };
    } catch (error) {
      setState(prev => ({ ...prev, isValidating: false }));
      handleError(error, 'Failed to validate form');
      return { isValid: false, errors: {} as Record<keyof T, string> };
    }
  }, [state.data, validateField, context, handleError]);

  // Clear validation errors
  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {} as Record<keyof T, string>,
      isValid: true
    }));
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setState({
      data: initialData,
      errors: {} as Record<keyof T, string>,
      isValid: true,
      isDirty: false,
      isValidating: false,
      touchedFields: new Set()
    });
  }, [initialData]);

  // Get error for specific field
  const getFieldError = useCallback((field: keyof T) => {
    return state.errors[field] || '';
  }, [state.errors]);

  // Check if field has been touched
  const isFieldTouched = useCallback((field: keyof T) => {
    return state.touchedFields.has(field);
  }, [state.touchedFields]);

  // Computed values
  const hasErrors = useMemo(() => {
    return Object.values(state.errors).some(error => error && error.length > 0);
  }, [state.errors]);

  const touchedFieldsWithErrors = useMemo(() => {
    return Array.from(state.touchedFields).filter(field => state.errors[field]);
  }, [state.touchedFields, state.errors]);

  return {
    // Data
    data: state.data,
    
    // Validation state
    errors: state.errors,
    isValid: state.isValid && !hasErrors,
    isDirty: state.isDirty,
    isValidating: state.isValidating,
    hasErrors,
    touchedFieldsWithErrors,

    // Actions
    handleFieldChange,
    validateField,
    validateForm,
    clearErrors,
    resetForm,

    // Utilities
    getFieldError,
    isFieldTouched,
    
    // Raw state for advanced usage
    touchedFields: state.touchedFields
  };
}