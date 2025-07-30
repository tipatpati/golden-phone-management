/**
 * Centralized input validation system
 * Combines and enhances existing validation utilities
 */

import { validateInput as securityValidation } from './securityEnhancements';
import { sanitizeInput, sanitizeEmail, sanitizePhone, validateNumericInput } from './inputSanitizer';
import { log } from './logger';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: any;
}

export interface ValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  sanitize?: boolean;
}

class ValidationEngine {
  /**
   * Validate email with security checks and sanitization
   */
  email(value: string, options: ValidationOptions = {}): ValidationResult {
    const { required = true, sanitize = true } = options;

    if (!value && !required) {
      return { isValid: true, sanitizedValue: '' };
    }

    if (!value && required) {
      return { isValid: false, error: 'Email is required' };
    }

    // Security validation
    const securityResult = securityValidation.email(value);
    if (!securityResult.valid) {
      log.warn('Email validation failed', { value: value.substring(0, 10) + '...', error: securityResult.error }, 'Validation');
      return { isValid: false, error: securityResult.error };
    }

    const sanitizedValue = sanitize ? sanitizeEmail(value) : value;
    
    if (sanitize && !sanitizedValue) {
      return { isValid: false, error: 'Invalid email format after sanitization' };
    }

    return { isValid: true, sanitizedValue };
  }

  /**
   * Validate password with security requirements
   */
  password(value: string, options: ValidationOptions & { isSignup?: boolean } = {}): ValidationResult {
    const { required = true, isSignup = false } = options;

    if (!value && !required) {
      return { isValid: true, sanitizedValue: '' };
    }

    if (!value && required) {
      return { isValid: false, error: 'Password is required' };
    }

    const securityResult = securityValidation.password(value, isSignup);
    if (!securityResult.valid) {
      log.warn('Password validation failed', { isSignup, error: securityResult.error }, 'Validation');
      return { isValid: false, error: securityResult.error };
    }

    return { isValid: true, sanitizedValue: value };
  }

  /**
   * Validate username with sanitization
   */
  username(value: string, options: ValidationOptions = {}): ValidationResult {
    const { required = false, sanitize = true } = options;

    if (!value && !required) {
      return { isValid: true, sanitizedValue: '' };
    }

    if (!value && required) {
      return { isValid: false, error: 'Username is required' };
    }

    const securityResult = securityValidation.username(value);
    if (!securityResult.valid) {
      log.warn('Username validation failed', { value: value.substring(0, 10) + '...', error: securityResult.error }, 'Validation');
      return { isValid: false, error: securityResult.error };
    }

    const sanitizedValue = sanitize ? sanitizeInput(value) : value;

    return { isValid: true, sanitizedValue };
  }

  /**
   * Validate phone number with sanitization
   */
  phone(value: string, options: ValidationOptions = {}): ValidationResult {
    const { required = false, sanitize = true } = options;

    if (!value && !required) {
      return { isValid: true, sanitizedValue: '' };
    }

    if (!value && required) {
      return { isValid: false, error: 'Phone number is required' };
    }

    const securityResult = securityValidation.phone(value);
    if (!securityResult.valid) {
      log.warn('Phone validation failed', { value: value.substring(0, 5) + '...', error: securityResult.error }, 'Validation');
      return { isValid: false, error: securityResult.error };
    }

    const sanitizedValue = sanitize ? sanitizePhone(value) : value;

    return { isValid: true, sanitizedValue };
  }

  /**
   * Validate numeric inputs (price, quantity, etc.)
   */
  number(value: string | number, options: ValidationOptions = {}): ValidationResult {
    const { required = true, min, max } = options;
    
    if ((value === '' || value === null || value === undefined) && !required) {
      return { isValid: true, sanitizedValue: null };
    }

    if ((value === '' || value === null || value === undefined) && required) {
      return { isValid: false, error: 'This field is required' };
    }

    const numValue = validateNumericInput(value);
    
    if (numValue === null) {
      return { isValid: false, error: 'Please enter a valid number' };
    }

    if (min !== undefined && numValue < min) {
      return { isValid: false, error: `Value must be at least ${min}` };
    }

    if (max !== undefined && numValue > max) {
      return { isValid: false, error: `Value cannot exceed ${max}` };
    }

    return { isValid: true, sanitizedValue: numValue };
  }

  /**
   * Validate price inputs
   */
  price(value: string | number, options: ValidationOptions = {}): ValidationResult {
    const { min = 0, max = 999999 } = options;
    
    const result = this.number(value, { ...options, min, max });
    
    if (!result.isValid) {
      return result;
    }

    // Ensure price has at most 2 decimal places
    if (result.sanitizedValue !== null) {
      const roundedPrice = Math.round(result.sanitizedValue * 100) / 100;
      return { isValid: true, sanitizedValue: roundedPrice };
    }

    return result;
  }

  /**
   * Validate quantity inputs (must be integers)
   */
  quantity(value: string | number, options: ValidationOptions = {}): ValidationResult {
    const { min = 0, max = 100000 } = options;
    
    const result = this.number(value, { ...options, min, max });
    
    if (!result.isValid) {
      return result;
    }

    // Ensure quantity is an integer
    if (result.sanitizedValue !== null && !Number.isInteger(result.sanitizedValue)) {
      return { isValid: false, error: 'Quantity must be a whole number' };
    }

    return result;
  }

  /**
   * Validate general text inputs with sanitization
   */
  text(value: string, options: ValidationOptions = {}): ValidationResult {
    const { required = false, minLength, maxLength, pattern, sanitize = true } = options;

    if (!value && !required) {
      return { isValid: true, sanitizedValue: '' };
    }

    if (!value && required) {
      return { isValid: false, error: 'This field is required' };
    }

    const sanitizedValue = sanitize ? sanitizeInput(value) : value;

    if (minLength && sanitizedValue.length < minLength) {
      return { isValid: false, error: `Must be at least ${minLength} characters` };
    }

    if (maxLength && sanitizedValue.length > maxLength) {
      return { isValid: false, error: `Cannot exceed ${maxLength} characters` };
    }

    if (pattern && !pattern.test(sanitizedValue)) {
      return { isValid: false, error: 'Invalid format' };
    }

    return { isValid: true, sanitizedValue };
  }

  /**
   * Batch validate multiple fields
   */
  validateFields(fields: Record<string, { value: any; validator: keyof ValidationEngine; options?: any }>): { 
    isValid: boolean; 
    errors: Record<string, string>; 
    sanitizedValues: Record<string, any> 
  } {
    const errors: Record<string, string> = {};
    const sanitizedValues: Record<string, any> = {};
    
    for (const [fieldName, { value, validator, options = {} }] of Object.entries(fields)) {
      const validationMethod = this[validator] as any;
      if (typeof validationMethod === 'function') {
        const result = validationMethod.call(this, value, options);
        
        if (!result.isValid && result.error) {
          errors[fieldName] = result.error;
        } else {
          sanitizedValues[fieldName] = result.sanitizedValue;
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedValues
    };
  }
}

// Export singleton validation engine
export const validation = new ValidationEngine();

// Export for easier usage
export const validate = validation;