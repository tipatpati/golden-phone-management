import { useState, useCallback } from "react";
import { ClientFormData, ClientFormValidationError } from "../types";

export function useClientValidation() {
  const [errors, setErrors] = useState<ClientFormValidationError[]>([]);

  const validateForm = useCallback((data: Partial<ClientFormData>): ClientFormValidationError[] => {
    const newErrors: ClientFormValidationError[] = [];

    // Client type validation
    if (!data.type) {
      newErrors.push({ field: 'type', message: 'Client type is required' });
    }

    // Individual client validation
    if (data.type === 'individual') {
      if (!data.first_name?.trim()) {
        newErrors.push({ field: 'first_name', message: 'First name is required for individual clients' });
      }
      if (!data.last_name?.trim()) {
        newErrors.push({ field: 'last_name', message: 'Last name is required for individual clients' });
      }
    }

    // Business client validation
    if (data.type === 'business') {
      if (!data.company_name?.trim()) {
        newErrors.push({ field: 'company_name', message: 'Company name is required for business clients' });
      }
    }

    // Email validation
    if (data.email && data.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email.trim())) {
        newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
      }
    }

    // Phone validation (basic)
    if (data.phone && data.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.push({ field: 'phone', message: 'Please enter a valid phone number' });
      }
    }

    // Tax ID validation (basic format check)
    if (data.tax_id && data.tax_id.trim()) {
      if (data.tax_id.trim().length < 3) {
        newErrors.push({ field: 'tax_id', message: 'Tax ID must be at least 3 characters long' });
      }
    }

    // Status validation
    if (!data.status) {
      newErrors.push({ field: 'status', message: 'Status is required' });
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