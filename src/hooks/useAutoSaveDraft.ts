import { useCallback, useEffect, useRef, useState } from 'react';
import { autoSaveDraftService, type FormDraft, type AutoSaveConfig } from '@/services/core/AutoSaveDraftService';
import { toast } from 'sonner';

export interface UseAutoSaveDraftOptions extends AutoSaveConfig {
  enabled?: boolean;
  onDraftSaved?: (draftId: string) => void;
  onDraftLoaded?: (draft: FormDraft) => void;
  onError?: (error: Error) => void;
}

export interface UseAutoSaveDraftReturn {
  isDraftAvailable: boolean;
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  draftId: string | null;
  saveDraft: (formData: any, metadata?: Partial<FormDraft['metadata']>) => Promise<string | null>;
  loadDraft: () => FormDraft | null;
  deleteDraft: () => void;
  deleteAllDrafts: () => void;
  restoreDraft: () => FormDraft | null;
}

export function useAutoSaveDraft(
  formType: FormDraft['formType'],
  formData: any,
  options: UseAutoSaveDraftOptions = {}
): UseAutoSaveDraftReturn {
  const {
    enabled = true,
    debounceMs = 10000, // Less frequent saves
    onDraftSaved,
    onDraftLoaded,
    onError,
    ...config
  } = options;

  const [isDraftAvailable, setIsDraftAvailable] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>('');

  // Check for existing drafts on mount
  useEffect(() => {
    if (!enabled) return;

    const checkForDrafts = () => {
      try {
        const hasDraft = autoSaveDraftService.hasDraft(formType);
        setIsDraftAvailable(hasDraft);
      } catch (error) {
        console.error('Failed to check for drafts:', error);
        onError?.(error as Error);
      }
    };

    checkForDrafts();
  }, [formType, enabled, onError]);

  // Auto-save when form data changes
  useEffect(() => {
    if (!enabled || !formData) return;

    const currentDataString = JSON.stringify(formData);
    
    // Skip if data hasn't changed
    if (currentDataString === lastDataRef.current) return;
    
    lastDataRef.current = currentDataString;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      saveDraftInternal(formData);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData, enabled, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const saveDraftInternal = useCallback(async (data: any, metadata?: Partial<FormDraft['metadata']>) => {
    if (!enabled) return null;

    try {
      setIsAutoSaving(true);
      
      const savedDraftId = autoSaveDraftService.saveDraft(
        formType,
        data,
        metadata,
        config
      );
      
      setDraftId(savedDraftId);
      setLastSavedAt(new Date());
      setIsDraftAvailable(true);
      
      onDraftSaved?.(savedDraftId);
      
      return savedDraftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      onError?.(error as Error);
      return null;
    } finally {
      setIsAutoSaving(false);
    }
  }, [formType, enabled, config, onDraftSaved, onError]);

  const saveDraft = useCallback(async (data: any, metadata?: Partial<FormDraft['metadata']>) => {
    return await saveDraftInternal(data, metadata);
  }, [saveDraftInternal]);

  const loadDraft = useCallback(() => {
    if (!enabled) return null;

    try {
      const draft = autoSaveDraftService.loadDraft(formType);
      if (draft) {
        onDraftLoaded?.(draft);
      }
      return draft;
    } catch (error) {
      console.error('Failed to load draft:', error);
      onError?.(error as Error);
      return null;
    }
  }, [formType, enabled, onDraftLoaded, onError]);

  const deleteDraft = useCallback(() => {
    if (!enabled || !draftId) return;

    try {
      autoSaveDraftService.deleteDraft(formType, draftId);
      setDraftId(null);
      setIsDraftAvailable(false);
      setLastSavedAt(null);
    } catch (error) {
      console.error('Failed to delete draft:', error);
      onError?.(error as Error);
    }
  }, [formType, draftId, enabled, onError]);

  const deleteAllDrafts = useCallback(() => {
    if (!enabled) return;

    try {
      autoSaveDraftService.deleteAllDrafts(formType);
      setDraftId(null);
      setIsDraftAvailable(false);
      setLastSavedAt(null);
    } catch (error) {
      console.error('Failed to delete all drafts:', error);
      onError?.(error as Error);
    }
  }, [formType, enabled, onError]);

  const restoreDraft = useCallback(() => {
    if (!enabled) return null;

    try {
      const draft = loadDraft();
      if (draft) {
        // Removed intrusive toast notification
        return draft;
      }
      return null;
    } catch (error) {
      console.error('Failed to restore draft:', error);
      // Removed intrusive error toast
      onError?.(error as Error);
      return null;
    }
  }, [loadDraft, enabled, onError]);

  return {
    isDraftAvailable,
    isAutoSaving,
    lastSavedAt,
    draftId,
    saveDraft,
    loadDraft,
    deleteDraft,
    deleteAllDrafts,
    restoreDraft,
  };
}