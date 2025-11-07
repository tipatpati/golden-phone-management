import { useState } from "react";
import { EmployeeFormData } from "../types";

interface ValidationErrors {
  [key: string]: string;
}

export function useEmployeeValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (field: string, value: string, formData?: EmployeeFormData): string => {
    switch (field) {
      case 'first_name':
        if (!value.trim()) return 'Nome è obbligatorio';
        if (value.length < 2) return 'Nome deve essere almeno 2 caratteri';
        return '';

      case 'last_name':
        if (!value.trim()) return 'Cognome è obbligatorio';
        if (value.length < 2) return 'Cognome deve essere almeno 2 caratteri';
        return '';

      case 'email':
        if (!value.trim()) return 'Email è obbligatoria';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Email non valida';
        return '';

      case 'phone':
        if (value && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(value)) {
          return 'Numero di telefono non valido';
        }
        return '';

      case 'salary':
        if (value && (isNaN(Number(value)) || Number(value) < 0)) {
          return 'Stipendio deve essere un numero positivo';
        }
        return '';

      case 'hire_date':
        if (!value) return 'Data di assunzione è obbligatoria';
        const hireDate = new Date(value);
        const today = new Date();
        if (hireDate > today) return 'Data di assunzione non può essere nel futuro';
        return '';

      case 'role':
        if (!value) return 'Ruolo è obbligatorio';
        return '';

      case 'store_id':
        if (!value) return 'Negozio è obbligatorio';
        return '';

      default:
        return '';
    }
  };

  const validateForm = (formData: EmployeeFormData): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    // Validate all required fields
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof EmployeeFormData], formData);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return newErrors;
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
    hasErrors
  };
}