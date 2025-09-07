// ============================================
// UNIFIED INVENTORY TYPES - SINGLE SOURCE OF TRUTH
// ============================================
// This file centralizes all inventory-related types to eliminate duplication
// and ensure consistency across the entire inventory management system.

import type { BaseEntity } from '../core/BaseApiService';

// ============================================
// CORE ENTITY TYPES (Database Schema)
// ============================================

export interface Product extends BaseEntity {
  brand: string;
  model: string;
  year?: number;
  category_id: number;
  category?: {
    id: number;
    name: string;
  };
  category_name?: string;
  price?: number;
  min_price?: number;
  max_price?: number;
  stock: number;
  threshold: number;
  description?: string;
  has_serial: boolean;
  serial_numbers?: string[];
  barcode?: string;
  supplier?: string;
  product_units?: ProductUnit[];
}

export interface ProductUnit extends BaseEntity {
  product_id: string;
  serial_number: string;
  barcode?: string;
  battery_level?: number;
  color?: string;
  storage?: number;
  ram?: number;
  price?: number;
  min_price?: number;
  max_price?: number;
  status: 'available' | 'sold' | 'reserved' | 'damaged';
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

// ============================================
// FORM DATA TYPES (UI Layer)
// ============================================

export interface ProductFormData {
  brand: string;
  model: string;
  year?: number;
  category_id: number;
  price?: number;
  min_price?: number;
  max_price?: number;
  stock: number;
  threshold: number;
  description?: string;
  supplier?: string;
  barcode?: string;
  has_serial: boolean;
  serial_numbers?: string[];
  unit_entries?: UnitEntryForm[];
}

export interface UnitEntryForm {
  serial: string;
  price?: number;
  min_price?: number;
  max_price?: number;
  battery_level?: number;
  color?: string;
  storage?: number;
  ram?: number;
}

// ============================================
// API DATA TYPES (Service Layer)
// ============================================

export type CreateProductData = Omit<Product, keyof BaseEntity | 'category' | 'category_name'>;
export type UpdateProductData = Partial<CreateProductData>;

export type CreateProductUnitData = Omit<ProductUnit, keyof BaseEntity>;
export type UpdateProductUnitData = Partial<CreateProductUnitData>;

// ============================================
// ENHANCED PRODUCT TYPES
// ============================================

export interface ProductWithUnits extends Product {
  units?: ProductUnit[];
  unitCount?: number;
  availableUnits?: number;
}

export interface ProductForLabels extends Product {
  storage?: number;
  ram?: number;
}

// ============================================
// OPERATION RESULT TYPES
// ============================================

export class InventoryError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, any>;

  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.name = 'InventoryError';
    this.code = code;
    this.context = context;
  }
}

export interface InventoryOperationResult {
  success: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
}

export interface InventoryValidationResult {
  isValid: boolean;
  errors: InventoryValidationError[];
  warnings: InventoryValidationError[];
}

export interface InventoryValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================
// BARCODE TYPES
// ============================================

export interface BarcodeInfo {
  barcode: string;
  format: 'CODE128' | 'EAN13';
  entityType: 'product' | 'product_unit';
  entityId: string;
  isValid: boolean;
  generated_at: string;
}

export interface BarcodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================
// LABEL GENERATION TYPES
// ============================================

export interface LabelData {
  productName: string;
  serialNumber?: string;
  barcode: string;
  price?: number;
  maxPrice?: number;
  category?: string;
  color?: string;
  batteryLevel?: number;
  storage?: number;
  ram?: number;
}

export interface LabelGenerationOptions {
  companyName?: string;
  includePrice?: boolean;
  includeBattery?: boolean;
  includeSpecs?: boolean;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface InventorySearchFilters {
  searchTerm?: string;
  category?: number;
  status?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface InventoryStats {
  totalProducts: number;
  totalUnits: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
}

// ============================================
// BULK OPERATION TYPES
// ============================================

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  warnings: string[];
}

export interface BulkUpdateRequest {
  productIds: string[];
  updates: Partial<UpdateProductData>;
}

export interface BulkDeleteRequest {
  productIds: string[];
  confirmationCode?: string;
}

// ============================================
// LEGACY COMPATIBILITY (Deprecated - for gradual migration)
// ============================================

/** @deprecated Use InventoryValidationError instead */
export interface ValidationError extends InventoryValidationError {}

/** @deprecated Use InventoryValidationResult instead */
export interface ValidationResult extends InventoryValidationResult {}

/** @deprecated Use LabelData instead */
export interface ThermalLabelData extends LabelData {}

/** @deprecated Use LabelGenerationOptions instead */
export interface ThermalLabelOptions extends LabelGenerationOptions {}

// ============================================
// FORM COMPONENT TYPES (Legacy Support)
// ============================================

export interface SerialEntry {
  serial: string;
  color?: string;
  batteryLevel?: number;
  storage?: number;
  ram?: number;
  barcode: string;
  index: number;
}

export interface ProductFormValidationError {
  field: string;
  message: string;
}

export interface ProductFormProps {
  initialData?: Partial<any>;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  submitText?: string;
  onRegisterSubmit?: (submit: () => Promise<void>) => void;
  productId?: string;
}

export interface SerialNumberManagerProps {
  serialNumbers?: string;
  unitEntries: any[];
  onUnitEntriesChange: (entries: any[]) => void;
  onStockChange: (stock: number) => void;
  hasSerial: boolean;
  productId?: string;
}

export interface BarcodeManagerProps {
  serialNumbers: string;
  hasSerial: boolean;
  productId?: string;
  onBarcodeGenerated?: (barcode: string) => void;
}

// ============================================
// CONSTANTS
// ============================================

export const CATEGORY_OPTIONS = [
  { id: 1, name: "Phones" },
  { id: 2, name: "Accessories" },
  { id: 3, name: "Spare Parts" },
  { id: 4, name: "Protection" },
] as const;

export const STORAGE_OPTIONS = [
  { value: 16, label: "16 GB" },
  { value: 32, label: "32 GB" },
  { value: 64, label: "64 GB" },
  { value: 128, label: "128 GB" },
  { value: 256, label: "256 GB" },
  { value: 512, label: "512 GB" },
  { value: 1024, label: "1 TB" },
] as const;

export const PRODUCT_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'damaged', label: 'Damaged' },
] as const;