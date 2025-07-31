import { useState, useCallback } from "react";
import { EmployeeFormData, getInitialEmployeeFormData } from "../types";
import { useEmployeeValidation } from "./useEmployeeValidation";

export function useEmployeeForm(initialData?: Partial<EmployeeFormData>) {
  const [formData, setFormData] = useState<EmployeeFormData>(() => ({
    ...getInitialEmployeeFormData(),
    ...initialData
  }));

  const { errors, validateField, validateForm, clearError, clearAllErrors, hasErrors } = useEmployeeValidation();

  const handleChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      clearError(field);
    }
  }, [errors, clearError]);

  const handleBlur = useCallback((field: string) => {
    const error = validateField(field, formData[field as keyof EmployeeFormData], formData);
    if (error) {
      // Set individual field error without affecting others
      clearError(field);
      if (error) {
        validateField(field, formData[field as keyof EmployeeFormData], formData);
      }
    }
  }, [formData, validateField, clearError]);

  const resetForm = useCallback((newData?: Partial<EmployeeFormData>) => {
    setFormData({
      ...getInitialEmployeeFormData(),
      ...newData
    });
    clearAllErrors();
  }, [clearAllErrors]);

  const isValid = useCallback(() => {
    const validationErrors = validateForm(formData);
    return Object.keys(validationErrors).length === 0;
  }, [formData, validateForm]);

  return {
    formData,
    errors,
    hasErrors,
    handleChange,
    handleBlur,
    resetForm,
    isValid,
    validateForm: () => validateForm(formData)
  };
}