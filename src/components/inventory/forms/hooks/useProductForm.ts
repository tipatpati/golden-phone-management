import { useState, useCallback, useEffect } from "react";
import { ProductFormData } from "../types";
import { useProductValidation } from "./useProductValidation";
import { toast } from "@/components/ui/sonner";

interface UseProductFormOptions {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
}

export function useProductForm({ initialData, onSubmit }: UseProductFormOptions) {
  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    brand: '',
    model: '',
    year: undefined,
    category_id: undefined,
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
    setFormData(prev => ({ ...prev, [field]: value }));
    clearErrors(); // Clear errors when user starts typing
  }, [clearErrors]);

  const updateSerialNumbers = useCallback((value: string) => {
    setSerialNumbers(value);
    
    // Auto-update stock if has_serial is enabled
    if (formData.has_serial) {
      const lines = value.split('\n').filter(line => line.trim() !== '');
      updateField('stock', lines.length);
    }
    
    clearErrors();
  }, [formData.has_serial, updateField, clearErrors]);

  const handleSubmit = useCallback(async () => {
    const errors = validateForm(formData, serialNumbers);
    
    if (errors.length > 0) {
      toast.error("Please fix the form errors before submitting");
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
      category_id: undefined,
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