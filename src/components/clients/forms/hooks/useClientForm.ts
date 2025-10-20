import { useState, useCallback, useEffect } from "react";
import { ClientFormData } from "../types";
import { useClientValidation } from "./useClientValidation";
import { toast } from "@/components/ui/sonner";
import { useAutoSaveDraft } from "@/hooks/useAutoSaveDraft";

interface UseClientFormOptions {
  initialData?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => Promise<void>;
  enableDraftSaving?: boolean;
}

export function useClientForm({ initialData, onSubmit, enableDraftSaving = true }: UseClientFormOptions) {
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
  const [currentDraft, setCurrentDraft] = useState<any>(null);
  const { validateForm, clearErrors, getFieldError, hasErrors } = useClientValidation();
  const { 
    isDraftAvailable, 
    isAutoSaving, 
    lastSavedAt, 
    saveDraft, 
    loadDraft, 
    deleteDraft,
    restoreDraft: restoreDraftFromService
  } = useAutoSaveDraft('client', formData, { 
    enabled: enableDraftSaving,
    debounceMs: 10000, // 10 seconds
    onDraftSaved: () => {
      // Silent save - no toast notification for auto-save
    },
    onError: (error) => {
      console.error('Draft save error:', error);
    }
  });

  // Load the draft on mount if available
  useEffect(() => {
    if (isDraftAvailable && !initialData && !currentDraft) {
      const draft = loadDraft();
      if (draft) {
        setCurrentDraft(draft);
      }
    }
  }, [isDraftAvailable, initialData, loadDraft, currentDraft]);

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
      deleteDraft(); // Clear the draft after successful submission
      
      const displayName = getClientDisplayName();
      toast.success(displayName ? `Client ${displayName} saved successfully` : "Client saved successfully");
    } catch (error) {
      toast.error("Failed to save client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, clearErrors, deleteDraft, getClientDisplayName]);

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
    setCurrentDraft(null);
  }, [clearErrors]);

  // Enhanced restoreDraft that actually updates form state
  const restoreDraft = useCallback(() => {
    const draft = restoreDraftFromService();
    if (draft && draft.formData) {
      setFormData(draft.formData);
      setCurrentDraft(draft);
      toast.success("Bozza ripristinata");
      return draft;
    }
    return null;
  }, [restoreDraftFromService]);

  // Enhanced deleteDraft that also resets form and current draft
  const deleteDraftAndReset = useCallback(() => {
    deleteDraft();
    resetForm();
    setCurrentDraft(null);
  }, [deleteDraft, resetForm]);

  return {
    formData,
    isSubmitting,
    updateField,
    handleSubmit,
    resetForm,
    getFieldError,
    hasErrors,
    getClientDisplayName,
    // Enhanced draft functionality
    isDraftAvailable,
    isAutoSaving,
    lastSavedAt,
    saveDraft,
    loadDraft,
    deleteDraft: deleteDraftAndReset,
    restoreDraft,
    currentDraft
  };
}