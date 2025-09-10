import { useState, useCallback, useEffect } from "react";
import type { ProductFormData, UnitEntryForm } from "@/services/inventory/types";
import { useProductValidation } from "./useProductValidation";
import { toast } from "@/hooks/use-toast";
import { 
  transformUnitsToEntries, 
  validateProductUnitsData, 
  logDataTransformation 
} from "@/utils/crossModuleDataSync";
import { logger } from '@/utils/logger';

interface UseProductFormOptions {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
}

export function useProductForm({ initialData, onSubmit }: UseProductFormOptions) {
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    brand: '',
    model: '',
    year: undefined,
    category_id: 1, // Set default category to Phones
    price: undefined, // Make default prices optional
    min_price: undefined,
    max_price: undefined,
    stock: 0,
    threshold: 5,
    description: '',
    supplier: '',
    barcode: '',
    has_serial: true,
    serial_numbers: [],
    unit_entries: [], // New structured entries
    ...initialData
  });

  const [unitEntries, setUnitEntries] = useState<UnitEntryForm[]>(
    initialData?.unit_entries || [{ serial: '', battery_level: 0 }]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateForm, clearErrors, getFieldError, hasErrors } = useProductValidation();

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      logger.debug('Processing initialData', {
        hasUnits: !!(initialData as any).units,
        hasProductUnits: !!(initialData as any).product_units,
        hasUnitEntries: !!initialData.unit_entries,
        hasSerialNumbers: !!initialData.serial_numbers,
        hasSerial: initialData.has_serial
      }, 'useProductForm');

      // Validate unit data structure
      const validation = validateProductUnitsData(initialData);
      if (!validation.isValid) {
        logger.warn('Unit data validation failed', { errors: validation.errors }, 'useProductForm');
      }

      setFormData(prev => ({ ...prev, ...initialData }));
      
      // Priority order for unit data sources with unified transformation
      if (initialData.unit_entries && Array.isArray(initialData.unit_entries)) {
        logger.debug('Using unit_entries from form', { count: initialData.unit_entries.length }, 'useProductForm');
        logDataTransformation({
          source: 'form_unit_entries',
          target: 'useProductForm',
          input: initialData.unit_entries,
          output: initialData.unit_entries,
          timestamp: new Date(),
          success: true
        });
        setUnitEntries(initialData.unit_entries);
      } else if ((initialData as any).units && Array.isArray((initialData as any).units)) {
        // Use unified transformer for database units
        logger.debug('Transforming database units to unit entries', { count: (initialData as any).units.length }, 'useProductForm');
        const entries = transformUnitsToEntries((initialData as any).units);
        setUnitEntries(entries);
      } else if ((initialData as any).product_units && Array.isArray((initialData as any).product_units)) {
        // Use unified transformer for product_units
        logger.debug('Transforming product_units to unit entries', { count: (initialData as any).product_units.length }, 'useProductForm');
        const entries = transformUnitsToEntries((initialData as any).product_units);
        setUnitEntries(entries);
      } else if (initialData.serial_numbers && Array.isArray(initialData.serial_numbers)) {
        // Legacy conversion - only extract serial numbers
        logger.debug('Using legacy serial_numbers', { count: initialData.serial_numbers.length }, 'useProductForm');
        const entries = initialData.serial_numbers.map(serial => ({
          serial,
          battery_level: 0,
        } as UnitEntryForm));
        logDataTransformation({
          source: 'legacy_serial_numbers',
          target: 'useProductForm',
          input: initialData.serial_numbers,
          output: entries,
          timestamp: new Date(),
          success: true
        });
        setUnitEntries(entries);
      } else if (initialData.has_serial) {
        // For serialized products without unit data, show empty form
        logger.debug('Serialized product without unit data, showing empty form', {}, 'useProductForm');
        setUnitEntries([]);
      }
    }
  }, [initialData]);

  const updateField = useCallback((field: keyof ProductFormData, value: any) => {
    logger.debug('Field updated', { field: String(field), value }, 'useProductForm');
    setFormData(prev => ({ ...prev, [field]: value }));
    clearErrors();
  }, [clearErrors]);

  const updateUnitEntries = useCallback((entries: UnitEntryForm[]) => {
    setUnitEntries(entries);
    
    // Auto-update stock if has_serial is enabled
    if (formData.has_serial) {
      const validEntries = entries.filter(e => e.serial?.trim());
      setFormData(prev => ({ ...prev, stock: validEntries.length }));
    }
    
    clearErrors();
  }, [formData.has_serial, clearErrors]);

  const handleSubmit = useCallback(async () => {
    logger.debug('Form submit called', { formData }, 'useProductForm');
    const errors = validateForm(formData, unitEntries);
    
    if (errors.length > 0) {
      logger.warn('Form validation errors', { errors }, 'useProductForm');
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting",
        variant: "destructive"
      });
      return;
    }

    // Remove concatenation - use only structured data
    const serialArray = formData.has_serial && unitEntries.length > 0
      ? unitEntries
          .filter(e => e.serial?.trim())
          .map(e => e.serial)
      : [];

    const finalData: ProductFormData = {
      brand: formData.brand!,
      model: formData.model!,
      year: formData.year,
      category_id: formData.category_id!,
      price: formData.price || 0,
      min_price: formData.min_price || 0,
      max_price: formData.max_price || 0,
      stock: formData.has_serial ? unitEntries.filter(e => e.serial?.trim()).length : formData.stock!,
      threshold: formData.threshold!,
      description: formData.description,
      supplier: formData.supplier,
      barcode: formData.barcode,
      has_serial: formData.has_serial!,
      serial_numbers: formData.has_serial ? serialArray : undefined,
      unit_entries: formData.has_serial ? unitEntries.filter(e => e.serial?.trim()) : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(finalData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, unitEntries, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setFormData({
      brand: '',
      model: '',
      year: undefined,
      category_id: 1,
      price: undefined,
      min_price: undefined,
      max_price: undefined,
      stock: 0,
      threshold: 5,
      description: '',
      supplier: '',
      barcode: '',
      has_serial: true,
      serial_numbers: [],
      unit_entries: [],
    });
    setUnitEntries([{ serial: '', battery_level: 0 }]);
    clearErrors();
  }, [clearErrors]);

  return {
    formData,
    unitEntries,
    isSubmitting,
    updateField,
    updateUnitEntries,
    handleSubmit,
    resetForm,
    getFieldError,
    hasErrors
  };
}