import { useMemo } from 'react';
import { useAutoSaveDraft } from './useAutoSaveDraft';
import { SaleFormData, SaleItem } from '@/contexts/SaleCreationContext';

interface SaleFormSnapshot {
  items: SaleItem[];
  formData: SaleFormData;
  selectedClient: any | null;
}

interface UseSaleAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number;
  onDraftSaved?: () => void;
  onDraftLoaded?: (data: SaleFormSnapshot) => void;
  onError?: (error: Error) => void;
}

export function useSaleAutoSave(
  saleData: SaleFormSnapshot,
  options: UseSaleAutoSaveOptions = {}
) {
  const {
    enabled = true,
    debounceMs = 10000, // 10 seconds
    onDraftSaved,
    onDraftLoaded,
    onError
  } = options;

  // Prepare form data for auto-save
  const formDataForSave = useMemo(() => {
    return {
      items: saleData.items,
      formData: saleData.formData,
      selectedClient: saleData.selectedClient
    };
  }, [saleData]);

  // Calculate completion percentage based on filled fields
  const completionPercentage = useMemo(() => {
    let totalFields = 0;
    let filledFields = 0;

    // Count items
    totalFields += 1;
    if (saleData.items.length > 0) filledFields += 1;

    // Count payment method
    totalFields += 1;
    if (saleData.formData.payment_method) filledFields += 1;

    // Count client selection
    totalFields += 1;
    if (saleData.selectedClient) filledFields += 1;

    // Count payment amounts for hybrid
    if (saleData.formData.payment_method === 'hybrid') {
      totalFields += 3;
      if (saleData.formData.cash_amount > 0) filledFields += 1;
      if (saleData.formData.card_amount > 0) filledFields += 1;
      if (saleData.formData.bank_transfer_amount > 0) filledFields += 1;
    }

    return Math.round((filledFields / totalFields) * 100);
  }, [saleData]);

  // Determine last saved field
  const lastSavedField = useMemo(() => {
    if (saleData.items.length > 0) return 'items';
    if (saleData.selectedClient) return 'client';
    if (saleData.formData.payment_method) return 'payment_method';
    return undefined;
  }, [saleData]);

  const autoSaveConfig = useMemo(() => ({
    enabled,
    debounceMs,
    onDraftSaved,
    onDraftLoaded: (draft: any) => {
      if (onDraftLoaded && draft?.formData) {
        onDraftLoaded(draft.formData);
      }
    },
    onError
  }), [enabled, debounceMs, onDraftSaved, onDraftLoaded, onError]);

  const metadata = useMemo(() => ({
    completionPercentage,
    lastSavedField
  }), [completionPercentage, lastSavedField]);

  const draftResult = useAutoSaveDraft('sale', formDataForSave, autoSaveConfig);

  return {
    ...draftResult,
    metadata,
    completionPercentage,
    lastSavedField
  };
}