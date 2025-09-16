import { z } from 'zod';

export interface FormDraft {
  id: string;
  formType: 'acquisition' | 'product' | 'client' | 'employee' | 'sale';
  timestamp: number;
  version: string;
  formData: any;
  metadata: {
    completionPercentage: number;
    lastSavedField?: string;
    estimatedTimeRemaining?: number;
  };
}

export interface AutoSaveConfig {
  debounceMs?: number;
  maxDrafts?: number;
  enableEncryption?: boolean;
  excludeFields?: string[];
}

export class AutoSaveDraftService {
  private static instance: AutoSaveDraftService;
  private readonly STORAGE_PREFIX = 'draft_';
  private readonly VERSION = '1.0.0';
  
  private constructor() {}

  static getInstance(): AutoSaveDraftService {
    if (!AutoSaveDraftService.instance) {
      AutoSaveDraftService.instance = new AutoSaveDraftService();
    }
    return AutoSaveDraftService.instance;
  }

  /**
   * Save a draft to localStorage
   */
  saveDraft(
    formType: FormDraft['formType'], 
    formData: any, 
    metadata: Partial<FormDraft['metadata']> = {},
    config: AutoSaveConfig = {}
  ): string {
    try {
      const filteredData = this.filterSensitiveData(formData, config.excludeFields);
      
      const draft: FormDraft = {
        id: this.generateDraftId(formType),
        formType,
        timestamp: Date.now(),
        version: this.VERSION,
        formData: filteredData,
        metadata: {
          completionPercentage: this.calculateCompletionPercentage(formData, formType),
          lastSavedField: metadata.lastSavedField || 'unknown',
          ...metadata
        }
      };

      const storageKey = this.getStorageKey(formType, draft.id);
      localStorage.setItem(storageKey, JSON.stringify(draft));
      
      // Cleanup old drafts
      this.cleanupOldDrafts(formType, config.maxDrafts || 5);
      
      return draft.id;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }

  /**
   * Load the most recent draft for a form type
   */
  loadDraft(formType: FormDraft['formType']): FormDraft | null {
    try {
      const drafts = this.getAllDrafts(formType);
      return drafts.length > 0 ? drafts[0] : null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }

  /**
   * Load a specific draft by ID
   */
  loadDraftById(formType: FormDraft['formType'], draftId: string): FormDraft | null {
    try {
      const storageKey = this.getStorageKey(formType, draftId);
      const draftData = localStorage.getItem(storageKey);
      
      if (!draftData) return null;
      
      const draft = JSON.parse(draftData) as FormDraft;
      
      // Validate draft structure
      if (draft.version !== this.VERSION) {
        console.warn('Draft version mismatch, removing:', draft.id);
        this.deleteDraft(formType, draftId);
        return null;
      }
      
      return draft;
    } catch (error) {
      console.error('Failed to load draft by ID:', error);
      return null;
    }
  }

  /**
   * Delete a specific draft
   */
  deleteDraft(formType: FormDraft['formType'], draftId: string): void {
    try {
      const storageKey = this.getStorageKey(formType, draftId);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }

  /**
   * Delete all drafts for a form type
   */
  deleteAllDrafts(formType: FormDraft['formType']): void {
    try {
      const drafts = this.getAllDrafts(formType);
      drafts.forEach(draft => this.deleteDraft(formType, draft.id));
    } catch (error) {
      console.error('Failed to delete all drafts:', error);
    }
  }

  /**
   * Get all drafts for a form type, sorted by timestamp (newest first)
   */
  getAllDrafts(formType: FormDraft['formType']): FormDraft[] {
    try {
      const drafts: FormDraft[] = [];
      const prefix = this.getStorageKey(formType, '');
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          const draftData = localStorage.getItem(key);
          if (draftData) {
            try {
              const draft = JSON.parse(draftData) as FormDraft;
              if (draft.version === this.VERSION) {
                drafts.push(draft);
              }
            } catch (parseError) {
              console.warn('Invalid draft data, removing:', key);
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      return drafts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get all drafts:', error);
      return [];
    }
  }

  /**
   * Check if a draft exists for a form type
   */
  hasDraft(formType: FormDraft['formType']): boolean {
    return this.getAllDrafts(formType).length > 0;
  }

  private generateDraftId(formType: string): string {
    return `${formType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getStorageKey(formType: string, draftId: string): string {
    return `${this.STORAGE_PREFIX}${formType}_${draftId}`;
  }

  private filterSensitiveData(data: any, excludeFields: string[] = []): any {
    if (!data || typeof data !== 'object') return data;
    
    const defaultExcludes = ['password', 'token', 'secret', 'apiKey'];
    const allExcludes = [...defaultExcludes, ...excludeFields];
    
    const filtered = { ...data };
    
    for (const field of allExcludes) {
      if (field in filtered) {
        delete filtered[field];
      }
    }
    
    return filtered;
  }

  private calculateCompletionPercentage(formData: any, formType: FormDraft['formType']): number {
    if (!formData || typeof formData !== 'object') return 0;
    
    const requiredFields = this.getRequiredFields(formType);
    if (requiredFields.length === 0) return 0;
    
    const completedFields = requiredFields.filter(field => {
      const value = this.getNestedValue(formData, field);
      return value !== undefined && value !== null && value !== '';
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  private getRequiredFields(formType: FormDraft['formType']): string[] {
    switch (formType) {
      case 'acquisition':
        return ['supplierId', 'transactionDate', 'items'];
      case 'product':
        return ['brand', 'model', 'price'];
      case 'client':
        return ['name', 'type'];
      case 'employee':
        return ['name', 'email', 'role'];
      case 'sale':
        return ['items', 'formData.payment_method'];
      default:
        return [];
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private cleanupOldDrafts(formType: FormDraft['formType'], maxDrafts: number): void {
    try {
      const drafts = this.getAllDrafts(formType);
      if (drafts.length > maxDrafts) {
        const draftsToDelete = drafts.slice(maxDrafts);
        draftsToDelete.forEach(draft => this.deleteDraft(formType, draft.id));
      }
    } catch (error) {
      console.error('Failed to cleanup old drafts:', error);
    }
  }
}

export const autoSaveDraftService = AutoSaveDraftService.getInstance();