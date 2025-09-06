// Re-export types from the unified inventory types
// This file is kept for backward compatibility
export type { 
  ProductFormData,
  UnitEntryForm
} from '../../../services/inventory/types';

// Legacy interfaces for existing components

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
  // Deprecated but kept for compatibility in UI hints
  serialNumbers?: string;
  // New structured entries
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