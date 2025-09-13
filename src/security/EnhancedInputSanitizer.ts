/**
 * Enhanced Input Sanitization with Real-time Validation
 * Integrates with existing DataSanitizer and adds real-time validation
 */

import { dataSanitizer } from '@/security/DataSanitizer';
import { validation } from '@/utils/validation';
import { logger } from '@/utils/secureLogger';
import { ValidationResult } from '@/types/global';

export class EnhancedInputSanitizer {
  /**
   * Sanitize and validate input simultaneously
   */
  static sanitizeAndValidate(
    input: string,
    type: 'email' | 'phone' | 'text' | 'price' | 'quantity' | 'password',
    options: any = {}
  ): ValidationResult & { sanitizedValue: string } {
    try {
      // First sanitize the input
      const sanitizedValue = dataSanitizer.sanitizeInput(input, {
        allowHtml: false,
        maxLength: type === 'password' ? 128 : 255,
        ...options
      });

      // Then validate based on type using the existing validation utility
      let validationResult: any;
      
      switch (type) {
        case 'email':
          validationResult = validation.email(sanitizedValue, options);
          break;
        case 'phone':
          validationResult = validation.phone(sanitizedValue, options);
          break;
        case 'price':
          validationResult = validation.price(sanitizedValue, options);
          break;
        case 'quantity':
          validationResult = validation.quantity(sanitizedValue, options);
          break;
        case 'password':
          validationResult = validation.password(sanitizedValue, options);
          break;
        default:
          validationResult = validation.text(sanitizedValue, options);
      }

      // Convert to our ValidationResult format
      const result: ValidationResult = {
        isValid: validationResult.isValid,
        errors: validationResult.error ? [{ field: 'input', message: validationResult.error }] : []
      };

      return {
        ...result,
        sanitizedValue: validationResult.sanitizedValue || sanitizedValue
      };
    } catch (error) {
      logger.error('Sanitization and validation failed', { 
        type, 
        inputLength: input.length,
        error 
      }, 'EnhancedInputSanitizer');
      
      return {
        isValid: false,
        errors: [{ field: 'input', message: 'Invalid input' }],
        sanitizedValue: ''
      };
    }
  }

  /**
   * Batch sanitize and validate multiple inputs
   */
  static sanitizeAndValidateMultiple(
    inputs: Record<string, { value: string; type: string; options?: any }>
  ) {
    const results: Record<string, ValidationResult & { sanitizedValue: string }> = {};
    let hasErrors = false;

    for (const [field, config] of Object.entries(inputs)) {
      const result = this.sanitizeAndValidate(
        config.value,
        config.type as any,
        config.options
      );
      
      results[field] = result;
      if (!result.isValid) {
        hasErrors = true;
      }
    }

    return {
      results,
      isValid: !hasErrors,
      sanitizedValues: Object.fromEntries(
        Object.entries(results).map(([key, result]) => [key, result.sanitizedValue])
      )
    };
  }

  /**
   * Real-time input sanitization for forms
   */
  static createRealTimeSanitizer(
    onChange: (sanitizedValue: string, isValid: boolean) => void,
    type: string,
    debounceMs = 300
  ) {
    let timeoutId: NodeJS.Timeout;

    return (value: string) => {
      clearTimeout(timeoutId);
      
      // Immediate sanitization for basic security
      const quickSanitized = dataSanitizer.sanitizeInput(value, {
        allowHtml: false,
        maxLength: 1000
      });

      // Update immediately with sanitized value
      onChange(quickSanitized, true);

      // Debounced full validation
      timeoutId = setTimeout(() => {
        const result = this.sanitizeAndValidate(value, type as any);
        onChange(result.sanitizedValue, result.isValid);
      }, debounceMs);
    };
  }

  /**
   * Create secure form field props
   */
  static createSecureFieldProps(
    field: string,
    type: string,
    value: string,
    onChange: (field: string, value: string, isValid: boolean) => void,
    options: any = {}
  ) {
    const sanitizer = this.createRealTimeSanitizer(
      (sanitizedValue, isValid) => onChange(field, sanitizedValue, isValid),
      type,
      options.debounceMs
    );

    return {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        sanitizer(e.target.value);
      },
      onBlur: () => {
        // Full validation on blur
        const result = this.sanitizeAndValidate(value, type as any, options);
        onChange(field, result.sanitizedValue, result.isValid);
      }
    };
  }
}

// Create pre-configured sanitizers for common use cases
export const emailSanitizer = (value: string) => 
  EnhancedInputSanitizer.sanitizeAndValidate(value, 'email');

export const phoneSanitizer = (value: string) => 
  EnhancedInputSanitizer.sanitizeAndValidate(value, 'phone');

export const priceSanitizer = (value: string) => 
  EnhancedInputSanitizer.sanitizeAndValidate(value, 'price');

export const passwordSanitizer = (value: string, isSignup = false) => 
  EnhancedInputSanitizer.sanitizeAndValidate(value, 'password', { isSignup });

// Export the class as default
export default EnhancedInputSanitizer;