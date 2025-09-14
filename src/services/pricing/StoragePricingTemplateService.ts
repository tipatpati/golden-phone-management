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

  static applyTemplateDefaults(templateId: string, units: UnitEntryForm[], defaultPurchasePrice?: number, forceApply = false): ApplyPricingResult {
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
        let hasChanges = false;
        
        // Apply pricing based on mode (force apply or defaults only)
        if (forceApply || (!unit.price && rule.purchasePrice !== undefined)) {
          updatedUnits[i] = { ...unit, price: rule.purchasePrice };
          hasChanges = true;
        } else if (!unit.price && defaultPurchasePrice) {
          updatedUnits[i] = { ...unit, price: defaultPurchasePrice };
          hasChanges = true;
        }
        
        if (forceApply || (!unit.min_price && rule.minPrice !== undefined)) {
          updatedUnits[i] = { ...updatedUnits[i], min_price: rule.minPrice };
          hasChanges = true;
        }
        
        if (forceApply || (!unit.max_price && rule.maxPrice !== undefined)) {
          updatedUnits[i] = { ...updatedUnits[i], max_price: rule.maxPrice };
          hasChanges = true;
        }
        
        if (hasChanges) {
          appliedCount++;
        } else {
          skippedCount++;
        }
      } catch (error) {
        errors.push(`Failed to apply defaults to unit ${i + 1}: ${error}`);
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

  static getDefaultPricingForStorage(templateId: string, storage: number): Partial<UnitEntryForm> | null {
    const template = this.getTemplates().find(t => t.id === templateId);
    if (!template) return null;

    const rule = template.rules.find(r => r.storage === storage);
    if (!rule) return null;

    return {
      price: rule.purchasePrice,
      min_price: rule.minPrice,
      max_price: rule.maxPrice
    };
  }

  /**
   * Calculate default product-level prices based on template rules
   */
  static calculateDefaultPricesFromTemplate(templateId: string): { price?: number; min_price?: number; max_price?: number } | null {
    const template = this.getTemplates().find(t => t.id === templateId);
    if (!template || template.rules.length === 0) return null;

    const rules = template.rules.filter(r => 
      r.purchasePrice !== undefined || r.minPrice !== undefined || r.maxPrice !== undefined
    );

    if (rules.length === 0) return null;

    const result: { price?: number; min_price?: number; max_price?: number } = {};

    // Calculate average purchase price from rules that have it
    const purchasePrices = rules.filter(r => r.purchasePrice !== undefined).map(r => r.purchasePrice!);
    if (purchasePrices.length > 0) {
      result.price = purchasePrices.reduce((sum, price) => sum + price, 0) / purchasePrices.length;
    }

    // Calculate average min price from rules that have it
    const minPrices = rules.filter(r => r.minPrice !== undefined).map(r => r.minPrice!);
    if (minPrices.length > 0) {
      result.min_price = minPrices.reduce((sum, price) => sum + price, 0) / minPrices.length;
    }

    // Calculate average max price from rules that have it
    const maxPrices = rules.filter(r => r.maxPrice !== undefined).map(r => r.maxPrice!);
    if (maxPrices.length > 0) {
      result.max_price = maxPrices.reduce((sum, price) => sum + price, 0) / maxPrices.length;
    }

    return result;
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
      description: 'Default fallback pricing based on storage capacity',
      rules: [
        { storage: 64, purchasePrice: 200, minPrice: 180, maxPrice: 250 },
        { storage: 128, purchasePrice: 300, minPrice: 280, maxPrice: 350 },
        { storage: 256, purchasePrice: 400, minPrice: 380, maxPrice: 450 },
        { storage: 512, purchasePrice: 500, minPrice: 480, maxPrice: 550 },
      ]
    };
  }
}