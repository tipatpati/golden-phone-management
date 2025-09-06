// Unified types for inventory management system
import type { BaseEntity } from '../core/BaseApiService';

// Core product entity (matches database schema exactly)
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
}

// Product unit entity (matches database schema exactly)
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

// Form-specific types (used only in UI forms)
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

// API data types (for database operations)
export type CreateProductData = Omit<Product, keyof BaseEntity | 'category' | 'category_name'>;
export type UpdateProductData = Partial<CreateProductData>;

export type CreateProductUnitData = Omit<ProductUnit, keyof BaseEntity>;
export type UpdateProductUnitData = Partial<CreateProductUnitData>;

// Inventory operation results
export interface InventoryOperationResult {
  success: boolean;
  data?: any;
  errors: string[];
  warnings: string[];
}

export interface ProductWithUnits extends Product {
  units?: ProductUnit[];
  unitCount?: number;
  availableUnits?: number;
}

// Barcode types
export interface BarcodeInfo {
  barcode: string;
  format: 'CODE128' | 'EAN13';
  entityType: 'product' | 'product_unit';
  entityId: string;
  isValid: boolean;
  generated_at: string;
}

// Label generation types
export interface LabelData {
  productName: string;
  serialNumber?: string;
  barcode: string;
  price?: number;
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

// Validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}