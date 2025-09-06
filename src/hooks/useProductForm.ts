// ============================================
// SIMPLIFIED PRODUCT FORM HOOK
// ============================================
// Refactored to be more focused and maintainable

import { useState, useCallback, useEffect } from 'react';
import type { ProductFormData, UnitEntryForm } from '@/services/inventory/types';
import { useProductValidation } from '@/components/inventory/forms/hooks/useProductValidation';

export interface UseProductFormOptions {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
}

export function useProductForm({ initialData, onSubmit }: UseProductFormOptions) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [formData, setFormData] = useState<ProductFormData>(() => ({
    brand: '',
    model: '',
    category_id: 1,
    stock: 0,
    threshold: 5,
    has_serial: false,
    ...initialData
  }));

  const [unitEntries, setUnitEntries] = useState<UnitEntryForm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { validateForm, clearErrors, getFieldError, hasErrors } = useProductValidation();

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));

      // Convert serial numbers to unit entries if needed
      if (initialData.serial_numbers && initialData.serial_numbers.length > 0) {
        const entries = initialData.serial_numbers.map(serial => ({
          serial,
          price: initialData.price,
          min_price: initialData.min_price,
          max_price: initialData.max_price,
          battery_level: 80,
          color: '',
          storage: 128,
          ram: 6
        }));
        setUnitEntries(entries);
      }
    }
  }, [initialData]);

  // ============================================
  // UPDATE HANDLERS
  // ============================================

  const updateField = useCallback((field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    clearErrors();
  }, [clearErrors]);

  const updateUnitEntries = useCallback((entries: UnitEntryForm[]) => {
    setUnitEntries(entries);
    
    // Auto-update stock if product has serial numbers
    if (formData.has_serial) {
      const validEntries = entries.filter(e => e.serial?.trim());
      updateField('stock', validEntries.length);
    }
  }, [formData.has_serial, updateField]);

  // ============================================
  // SUBMISSION
  // ============================================

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Validate form
      const errors = validateForm(formData, unitEntries);
      if (errors.length > 0) {
        return;
      }

      // Prepare final data
      const finalData: ProductFormData = {
        ...formData,
        unit_entries: formData.has_serial ? unitEntries : undefined,
        serial_numbers: formData.has_serial ? unitEntries.map(e => e.serial) : undefined
      };

      await onSubmit(finalData);
      
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, unitEntries, validateForm, onSubmit]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const resetForm = useCallback(() => {
    setFormData({
      brand: '',
      model: '',
      category_id: 1,
      stock: 0,
      threshold: 5,
      has_serial: false,
    });
    setUnitEntries([]);
    clearErrors();
  }, [clearErrors]);

  // ============================================
  // RETURN API
  // ============================================

  return {
    // State
    formData,
    unitEntries,
    isSubmitting,
    
    // Actions
    updateField,
    updateUnitEntries,
    handleSubmit,
    resetForm,
    
    // Validation
    getFieldError,
    hasErrors,
  };
}