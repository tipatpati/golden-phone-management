export interface ProductFormData {
  brand: string;
  model: string;
  year?: number;
  category_id: number;
  price?: number;       // Optional default price for new units
  min_price?: number;   // Optional default min price for new units
  max_price?: number;   // Optional default max price for new units
  stock: number;
  threshold: number;
  description?: string;
  supplier?: string;
  barcode?: string;
  has_serial: boolean;
  serial_numbers?: string[];
  // New: structured unit entries for products with serial numbers
  unit_entries?: UnitEntryForm[];
}

// New: Structured unit entry used by forms (clean, readable fields)
export interface UnitEntryForm {
  serial: string;              // IMEI/SN only
  price?: number;              // Purchase price
  min_price?: number;          // Min selling (must be > price)
  max_price?: number;          // Max selling (must be > min_price)
  battery_level?: number;      // 0-100 integer
  color?: string;              // Text
  storage?: number;            // GB
  ram?: number;                // GB
}

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
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
  submitText?: string;
  onRegisterSubmit?: (submit: () => Promise<void>) => void;
}

export interface SerialNumberManagerProps {
  // Deprecated but kept for compatibility in UI hints
  serialNumbers?: string;
  // New structured entries
  unitEntries: UnitEntryForm[];
  onUnitEntriesChange: (entries: UnitEntryForm[]) => void;
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