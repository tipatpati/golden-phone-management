import { useState, useCallback, useEffect } from "react";
import { ClientFormData } from "../types";
import { useClientValidation } from "./useClientValidation";
import { toast } from "@/components/ui/sonner";

interface UseClientFormOptions {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
}

export function useClientForm({ initialData, onSubmit }: UseClientFormOptions) {
  const [formData, setFormData] = useState<Partial<ClientFormData>>({
    type: 'individual',
    first_name: '',
    last_name: '',
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    notes: '',
    status: 'active',
    ...initialData
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { validateForm, clearErrors, getFieldError, hasErrors } = useClientValidation();

  // Update form data when initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const updateField = useCallback((field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearErrors(); // Clear errors when user starts typing
  }, [clearErrors]);

  const getClientDisplayName = useCallback(() => {
    if (formData.type === 'business') {
      return formData.company_name || 'New Business Client';
    }
    const firstName = formData.first_name?.trim();
    const lastName = formData.last_name?.trim();
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || lastName || 'New Individual Client';
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    const errors = validateForm(formData);
    
    if (errors.length > 0) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    // Ensure required fields are present
    const finalData: ClientFormData = {
      type: formData.type!,
      first_name: formData.first_name,
      last_name: formData.last_name,
      company_name: formData.company_name,
      contact_person: formData.contact_person,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      tax_id: formData.tax_id,
      notes: formData.notes,
      status: formData.status!,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(finalData);
      
      // Success - clear form and show success message
      clearErrors();
      
      const displayName = getClientDisplayName();
      toast.success(displayName ? `Client ${displayName} saved successfully` : "Client saved successfully");
    } catch (error) {
      toast.error("Failed to save client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, clearErrors, getClientDisplayName]);

  const resetForm = useCallback(() => {
    setFormData({
      type: 'individual',
      first_name: '',
      last_name: '',
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      tax_id: '',
      notes: '',
      status: 'active',
    });
    clearErrors();
  }, [clearErrors]);

  return {
    formData,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
    getFieldError,
    hasErrors,
    getClientDisplayName
  };
}