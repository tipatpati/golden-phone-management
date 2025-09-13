import type { StoragePricingTemplate, StoragePricingRule, ApplyPricingResult } from '@/types/pricingTemplates';
import type { UnitEntryForm } from '@/services/inventory/types';

const STORAGE_KEY = 'storagePricingTemplates';

export class StoragePricingTemplateService {
  static getTemplates(): StoragePricingTemplate[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading pricing templates:', error);
      return [];
    }
  }

  static saveTemplate(template: Omit<StoragePricingTemplate, 'id' | 'createdAt' | 'updatedAt'>): StoragePricingTemplate {
    const templates = this.getTemplates();
    const newTemplate: StoragePricingTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    templates.push(newTemplate);
    this.saveToStorage(templates);
    return newTemplate;
  }

  static updateTemplate(id: string, updates: Partial<StoragePricingTemplate>): StoragePricingTemplate {
    const templates = this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Template not found');
    }
    
    templates[index] = {
      ...templates[index],
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    };
    
    this.saveToStorage(templates);
    return templates[index];
  }

  static deleteTemplate(id: string): void {
    const templates = this.getTemplates().filter(t => t.id !== id);
    this.saveToStorage(templates);
  }

  static applyTemplateToUnits(templateId: string, units: UnitEntryForm[]): ApplyPricingResult {
    const template = this.getTemplates().find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let appliedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const updatedUnits = [...units];

    for (let i = 0; i < updatedUnits.length; i++) {
      const unit = updatedUnits[i];
      
      if (!unit.storage) {
        skippedCount++;
        continue;
      }

      const rule = template.rules.find(r => r.storage === unit.storage);
      if (!rule) {
        skippedCount++;
        continue;
      }

      try {
        // Apply pricing from template rule
        if (rule.sellingPrice !== undefined) {
          updatedUnits[i] = { ...unit, price: rule.sellingPrice };
        }
        if (rule.minPrice !== undefined) {
          updatedUnits[i] = { ...updatedUnits[i], min_price: rule.minPrice };
        }
        if (rule.maxPrice !== undefined) {
          updatedUnits[i] = { ...updatedUnits[i], max_price: rule.maxPrice };
        }
        
        appliedCount++;
      } catch (error) {
        errors.push(`Failed to apply pricing to unit ${i + 1}: ${error}`);
        skippedCount++;
      }
    }

    return {
      appliedCount,
      skippedCount,
      errors,
      updatedUnits
    };
  }

  private static saveToStorage(templates: StoragePricingTemplate[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving pricing templates:', error);
      throw new Error('Failed to save pricing templates');
    }
  }

  static getDefaultTemplate(): Partial<StoragePricingTemplate> {
    return {
      name: 'New Storage Pricing Template',
      description: 'Default pricing based on storage capacity',
      rules: [
        { storage: 64, sellingPrice: 200, minPrice: 180, maxPrice: 250 },
        { storage: 128, sellingPrice: 300, minPrice: 280, maxPrice: 350 },
        { storage: 256, sellingPrice: 400, minPrice: 380, maxPrice: 450 },
        { storage: 512, sellingPrice: 500, minPrice: 480, maxPrice: 550 },
      ]
    };
  }
}