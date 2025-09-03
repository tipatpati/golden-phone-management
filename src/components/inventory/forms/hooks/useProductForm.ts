import { useState, useCallback, useEffect } from "react";
import { ProductFormData } from "../types";
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
    price: 0,
    min_price: 0,
    max_price: 0,
    stock: 0,
    threshold: 5,
    description: '',
    supplier: '',
    barcode: '',
    has_serial: true,
    serial_numbers: [],
    ...initialData
  });

  const [serialNumbers, setSerialNumbers] = useState(
    initialData?.serial_numbers ? initialData.serial_numbers.join('\n') : ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateForm, clearErrors, getFieldError, hasErrors } = useProductValidation();

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      if (initialData.serial_numbers) {
        setSerialNumbers(initialData.serial_numbers.join('\n'));
      }
    }
  }, [initialData]);

  const updateField = useCallback((field: keyof ProductFormData, value: any) => {
    console.log(`🔄 updateField: ${field} = ${value}`);
    setFormData(prev => ({ ...prev, [field]: value }));
    // Only clear errors when user actively changes fields, don't trigger validation
    clearErrors();
  }, []);

  const updateSerialNumbers = useCallback((value: string) => {
    setSerialNumbers(value);
    
    // Auto-update stock if has_serial is enabled
    if (formData.has_serial) {
      const lines = value.split('\n').filter(line => line.trim() !== '');
      setFormData(prev => ({ ...prev, stock: lines.length }));
    }
    
    // Only clear errors when user is actively typing, don't trigger validation
    clearErrors();
  }, [formData.has_serial]);

  const handleSubmit = useCallback(async () => {
    console.log('🔄 useProductForm handleSubmit called with formData:', formData);
    const errors = validateForm(formData, serialNumbers);
    
    if (errors.length > 0) {
      console.log('❌ Form validation errors:', errors);
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting",
        variant: "destructive"
      });
      return;
    }

    // Prepare final data
    const serialArray = formData.has_serial && serialNumbers.trim() 
      ? serialNumbers.split('\n').map(s => s.trim()).filter(s => s !== "") 
      : [];

    const finalData: ProductFormData = {
      brand: formData.brand!,
      model: formData.model!,
      year: formData.year,
      category_id: formData.category_id!,
      price: formData.price!,
      min_price: formData.min_price!,
      max_price: formData.max_price!,
      stock: formData.has_serial ? serialArray.length : formData.stock!,
      threshold: formData.threshold!,
      description: formData.description,
      supplier: formData.supplier,
      barcode: formData.barcode,
      has_serial: formData.has_serial!,
      serial_numbers: formData.has_serial ? serialArray : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(finalData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, serialNumbers, validateForm, onSubmit]);

  const resetForm = useCallback(() => {
    setFormData({
      brand: '',
      model: '',
      year: undefined,
      category_id: 1, // Set default to Phones
      price: 0,
      min_price: 0,
      max_price: 0,
      stock: 0,
      threshold: 5,
      description: '',
      supplier: '',
      barcode: '',
      has_serial: true,
      serial_numbers: [],
    });
    setSerialNumbers('');
    clearErrors();
  }, [clearErrors]);

  return {
    formData,
    serialNumbers,
    isSubmitting,
    updateField,
    updateSerialNumbers,
    handleSubmit,
    resetForm,
    getFieldError,
    hasErrors
  };
}