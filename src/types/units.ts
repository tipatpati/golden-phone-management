/**
 * UNIFIED UNIT TYPE DEFINITIONS
 * Single source of truth for all unit-related types across inventory and supplier modules
 */

export interface BaseUnit {
  id?: string;
  product_id?: string; // Optional for compatibility
  serial_number: string;
  barcode?: string;
  color?: string;
  storage?: number;
  ram?: number;
  battery_level?: number;
  price?: number;
  min_price?: number;
  max_price?: number;
  purchase_price?: number;
  purchase_date?: string;
  supplier_id?: string;
  condition?: 'new' | 'used' | string;
  status?: 'available' | 'sold' | 'damaged' | 'repair' | 'reserved' | string;
  created_at?: string;
  updated_at?: string;
}

export interface UnitFormData {
  serial: string;
  barcode?: string;
  color?: string;
  storage?: number;
  ram?: number;
  battery_level?: number;
  condition?: 'new' | 'used';
  price?: number;
  min_price?: number;
  max_price?: number;
  purchase_date?: string;
  purchase_price?: number;
  supplier_id?: string;
  status?: string;
}

export interface UnitOperationOptions {
  source: 'inventory' | 'supplier';
  transactionId?: string;
  supplierId?: string;
  unitCost?: number;
  metadata?: Record<string, any>;
}

export interface UnitOperationResult {
  success: boolean;
  units: BaseUnit[];
  createdCount: number;
  updatedCount: number;
  errors: string[];
  warnings: string[];
}

export interface ProductWithUnitsData {
  product: any;
  units: BaseUnit[];
  unitEntries: UnitFormData[];
}

export interface BarcodeGenerationResult {
  success: boolean;
  barcodes: Array<{
    serial: string;
    barcode: string;
  }>;
  errors: string[];
}

export interface LabelPrintingResult {
  success: boolean;
  totalLabels: number;
  printedUnits: string[];
  errors: string[];
}