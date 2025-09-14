/**
 * Storage-based pricing template types
 */

export interface StoragePricingRule {
  storage: number; // Storage in GB
  purchasePrice?: number; // Default purchase price for this storage
  minPrice?: number;      // Default minimum selling price
  maxPrice?: number;      // Default maximum selling price
}

export interface StoragePricingTemplate {
  id: string;
  name: string;
  description?: string;
  rules: StoragePricingRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingTemplateService {
  getTemplates(): StoragePricingTemplate[];
  saveTemplate(template: Omit<StoragePricingTemplate, 'id' | 'createdAt' | 'updatedAt'>): StoragePricingTemplate;
  updateTemplate(id: string, template: Partial<StoragePricingTemplate>): StoragePricingTemplate;
  deleteTemplate(id: string): void;
  applyTemplateDefaults(templateId: string, units: any[]): any[];
}

export interface ApplyPricingResult {
  appliedCount: number;
  skippedCount: number;
  errors: string[];
  updatedUnits: any[];
}

export interface DefaultPricesFromTemplate {
  price?: number;
  min_price?: number;
  max_price?: number;
}