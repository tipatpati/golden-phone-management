import { useState, useCallback, useEffect } from "react";
import type { ProductFormData, UnitEntryForm } from "@/services/inventory/types";
import { useProductValidation } from "./useProductValidation";
import { toast } from "@/hooks/use-toast";

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
      setFormData(prev => ({ ...prev, ...initialData }));
      
      // Priority order for unit data sources:
      // 1. unit_entries (from form submission)
      // 2. units (from database via getProductWithUnits)
      // 3. serial_numbers (legacy format)
      if (initialData.unit_entries) {
        setUnitEntries(initialData.unit_entries);
      } else if ((initialData as any).units && Array.isArray((initialData as any).units)) {
        // Transform product_units from database to UnitEntryForm format
        console.log('🔄 Transforming database units to unit entries:', (initialData as any).units);
        const entries = (initialData as any).units.map((unit: any) => ({
          serial: unit.serial_number,
          battery_level: unit.battery_level || 0,
          color: unit.color,
          storage: unit.storage,
          ram: unit.ram,
          price: unit.price,
          min_price: unit.min_price,
          max_price: unit.max_price,
        } as UnitEntryForm));
        setUnitEntries(entries.length > 0 ? entries : [{ serial: '', battery_level: 0 }]);
      } else if (initialData.serial_numbers) {
        // Simple conversion - only extract serial numbers
        const entries = initialData.serial_numbers.map(serial => ({
          serial,
          battery_level: 0,
        } as UnitEntryForm));
        setUnitEntries(entries.length > 0 ? entries : [{ serial: '', battery_level: 0 }]);
      }
    }
  }, [initialData]);

  const updateField = useCallback((field: keyof ProductFormData, value: any) => {
    console.log(`🔄 updateField: ${String(field)} = ${value}`);
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
    console.log('🔄 useProductForm handleSubmit called with formData:', formData);
    const errors = validateForm(formData, unitEntries);
    
    if (errors.length > 0) {
      console.log('❌ Form validation errors:', errors);
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