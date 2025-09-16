import { useState, useEffect, useCallback, useRef } from 'react';

interface SimpleDraft {
  formData: any;
  timestamp: number;
}

interface UseSimpleDraftOptions {
  autoSaveDelay?: number; // ms
  enabled?: boolean;
}

interface UseSimpleDraftReturn {
  hasDraft: boolean;
  loadDraft: () => any | null;
  clearDraft: () => void;
  onFormSubmitSuccess: () => void;
}

export function useSimpleDraft(
  formType: string,
  formData: any,
  options: UseSimpleDraftOptions = {}
): UseSimpleDraftReturn {
  const { autoSaveDelay = 10000, enabled = true } = options;
  const [hasDraft, setHasDraft] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');

  const getDraftKey = useCallback(() => `simple_draft_${formType}`, [formType]);

  // Check for existing draft on mount
  useEffect(() => {
    if (!enabled) return;
    
    const draftKey = getDraftKey();
    const savedDraft = localStorage.getItem(draftKey);
    setHasDraft(!!savedDraft);
  }, [enabled, getDraftKey]);

  // Auto-save form data
  useEffect(() => {
    if (!enabled || !formData) return;

    const currentDataString = JSON.stringify(formData);
    
    // Don't save if data hasn't changed
    if (currentDataString === lastSavedDataRef.current) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      const draft: SimpleDraft = {
        formData,
        timestamp: Date.now()
      };
      
      localStorage.setItem(getDraftKey(), JSON.stringify(draft));
      lastSavedDataRef.current = currentDataString;
      setHasDraft(true);
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, enabled, autoSaveDelay, getDraftKey]);

  const loadDraft = useCallback((): any | null => {
    if (!enabled) return null;
    
    const draftKey = getDraftKey();
    const savedDraft = localStorage.getItem(draftKey);
    
    if (!savedDraft) return null;

    try {
      const draft: SimpleDraft = JSON.parse(savedDraft);
      return draft.formData;
    } catch (error) {
      console.warn('Failed to parse saved draft:', error);
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      return null;
    }
  }, [enabled, getDraftKey]);

  const clearDraft = useCallback(() => {
    const draftKey = getDraftKey();
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    lastSavedDataRef.current = '';
  }, [getDraftKey]);

  const onFormSubmitSuccess = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    hasDraft,
    loadDraft,
    clearDraft,
    onFormSubmitSuccess
  };
}