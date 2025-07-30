import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { FormState, FormActions } from '@/types';
import { useErrorHandler } from '@/utils/errorHandler';

/**
 * Reusable form hook with validation, error handling, and state management
 */
export function useForm<T extends Record<string, any>>(
  initialData: T,
  validationSchema?: z.ZodSchema<T>,
  componentName: string = 'Form'
) {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const { handleError } = useErrorHandler(componentName);

  const validate = useCallback((): boolean => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof T;
          if (field) {
            newErrors[field] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        handleError(error, 'validation', false);
      }
      return false;
    }
  }, [data, validationSchema, handleError]);

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setIsLoading(false);
    setIsDirty(false);
  }, [initialData]);

  const setFormErrors = useCallback((newErrors: Partial<Record<keyof T, string>>) => {
    setErrors(newErrors);
  }, []);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && isDirty;
  }, [errors, isDirty]);

  const formState: FormState<T> = {
    data,
    errors,
    isLoading,
    isDirty,
    isValid
  };

  const formActions: FormActions<T> = {
    updateField,
    setErrors: setFormErrors,
    reset: resetForm,
    validate
  };

  // Additional utilities
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handleSubmit = useCallback(async <R>(
    submitFn: (data: T) => Promise<R>,
    onSuccess?: (result: R) => void,
    onError?: (error: any) => void
  ): Promise<void> => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await submitFn(data);
      onSuccess?.(result);
      setIsDirty(false);
    } catch (error) {
      const handled = handleError(error, 'submit');
      onError?.(handled);
    } finally {
      setIsLoading(false);
    }
  }, [data, validate, handleError]);

  return {
    ...formState,
    ...formActions,
    setLoading,
    handleSubmit,
    hasErrors: Object.keys(errors).length > 0,
    getFieldError: (field: keyof T) => errors[field],
    isFieldValid: (field: keyof T) => !errors[field] && isDirty,
  };
}

/**
 * Hook for managing multiple form steps/pages
 */
export function useMultiStepForm<T extends Record<string, any>>(
  steps: Array<{
    name: string;
    schema?: z.ZodSchema<Partial<T>>;
  }>,
  initialData: T,
  componentName: string = 'MultiStepForm'
) {
  const [currentStep, setCurrentStep] = useState(0);
  const form = useForm(initialData, undefined, componentName);

  const validateCurrentStep = useCallback((): boolean => {
    const currentStepSchema = steps[currentStep]?.schema;
    if (!currentStepSchema) return true;

    try {
      currentStepSchema.parse(form.data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof T;
          if (field) {
            newErrors[field] = err.message;
          }
        });
        form.setErrors(newErrors);
      }
      return false;
    }
  }, [currentStep, steps, form]);

  const nextStep = useCallback(() => {
    if (validateCurrentStep() && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length, validateCurrentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  return {
    ...form,
    currentStep,
    totalSteps: steps.length,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    currentStepName: steps[currentStep]?.name,
    nextStep,
    prevStep,
    goToStep,
    validateCurrentStep,
    progress: ((currentStep + 1) / steps.length) * 100
  };
}