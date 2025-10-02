/**
 * Category Utility Functions
 * Helper functions for category-specific logic and field visibility
 */

import { CATEGORY_FIELD_CONFIG, type CategoryFieldConfig } from '@/services/inventory/types';

/**
 * Category icons mapping
 */
export const CATEGORY_ICONS: Record<string, string> = {
  'Phones': '📱',
  'Tablets': '📲',
  'Computers': '💻',
  'Smartphones': '📱',
  'Accessories': '🎧',
  'Repairs': '🔧',
  'Electronics': '⚡',
  'Audio': '🔊',
  'Spare Parts': '🔩',
  'Protection': '🛡️',
};

/**
 * Get category icon by category name
 */
export function getCategoryIcon(categoryName?: string): string | null {
  if (!categoryName) return null;
  return CATEGORY_ICONS[categoryName] || null;
}

/**
 * Get field configuration for a specific category
 */
export function getCategoryFieldConfig(categoryId?: number): CategoryFieldConfig {
  if (!categoryId) {
    return {
      requiresDeviceSpecs: false,
      fields: {}
    };
  }
  
  return CATEGORY_FIELD_CONFIG[categoryId] || {
    requiresDeviceSpecs: false,
    fields: {}
  };
}

/**
 * Check if a category requires serial numbers
 */
export function categoryRequiresSerialNumbers(categoryId?: number): boolean {
  if (!categoryId) return false;
  // Phones (1), Tablets (3), Computers (9), Smartphones (13)
  return [1, 3, 9, 13].includes(categoryId);
}

/**
 * Check if a specific field should be visible for a category
 */
export function shouldShowField(
  categoryId: number | undefined,
  fieldName: 'storage' | 'ram' | 'color' | 'batteryLevel'
): boolean {
  if (!categoryId) return false;
  const config = getCategoryFieldConfig(categoryId);
  return config.fields[fieldName] === true;
}

/**
 * Get category-specific guidance text
 */
export function getCategoryGuidance(categoryId?: number): string {
  if (!categoryId) return '';
  
  const config = getCategoryFieldConfig(categoryId);
  
  if (!config.requiresDeviceSpecs) {
    return 'This category does not require device specifications.';
  }
  
  const requiredFields = [];
  if (config.fields.storage) requiredFields.push('Storage');
  if (config.fields.ram) requiredFields.push('RAM');
  if (config.fields.color) requiredFields.push('Color');
  if (config.fields.batteryLevel) requiredFields.push('Battery Level');
  
  if (requiredFields.length === 0) return '';
  
  return `This category requires: ${requiredFields.join(', ')}`;
}
