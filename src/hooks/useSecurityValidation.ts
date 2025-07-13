import { useState, useCallback } from 'react';
import { validateInput, monitorSecurityEvents } from '@/utils/securityEnhancements';

interface ValidationState {
  value: string;
  error: string;
  isValid: boolean;
}

interface UseSecurityValidationOptions {
  validateOnChange?: boolean;
  sanitizeInput?: boolean;
  monitorSuspicious?: boolean;
}

export function useSecurityValidation(
  validationType: 'email' | 'password' | 'username' | 'phone',
  options: UseSecurityValidationOptions = {}
) {
  const {
    validateOnChange = true,
    sanitizeInput = true,
    monitorSuspicious = true
  } = options;

  const [state, setState] = useState<ValidationState>({
    value: '',
    error: '',
    isValid: false
  });

  const validate = useCallback((value: string, isSignup = false): boolean => {
    let validation;
    
    switch (validationType) {
      case 'email':
        validation = validateInput.email(value);
        break;
      case 'password':
        validation = validateInput.password(value, isSignup);
        break;
      case 'username':
        validation = validateInput.username(value);
        break;
      case 'phone':
        validation = validateInput.phone(value);
        break;
      default:
        validation = { valid: true };
    }

    setState(prev => ({
      ...prev,
      error: validation.valid ? '' : validation.error || '',
      isValid: validation.valid
    }));

    return validation.valid;
  }, [validationType]);

  const setValue = useCallback((newValue: string, isSignup = false) => {
    let processedValue = newValue;
    
    // Apply sanitization if enabled
    if (sanitizeInput && validationType !== 'password') {
      // Don't sanitize passwords as it might remove valid characters
      processedValue = newValue.trim();
    }

    // Monitor for suspicious input
    if (monitorSuspicious) {
      monitorSecurityEvents.trackSuspiciousInput(newValue, validationType);
    }

    setState(prev => ({
      ...prev,
      value: processedValue
    }));

    // Validate if enabled
    if (validateOnChange) {
      validate(processedValue, isSignup);
    }
  }, [sanitizeInput, monitorSuspicious, validateOnChange, validate, validationType]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: '',
      isValid: true
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      value: '',
      error: '',
      isValid: false
    });
  }, []);

  return {
    value: state.value,
    error: state.error,
    isValid: state.isValid,
    setValue,
    validate,
    clearError,
    reset
  };
}