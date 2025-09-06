export interface ThermalLabelData {
  productName: string;
  serialNumber?: string;
  barcode: string;
  price: number;
  maxPrice?: number;
  minPrice?: number;
  category?: string;
  color?: string;
  batteryLevel?: number;
  storage?: number;
  ram?: number;
}

export interface ThermalLabelOptions {
  copies: number;
  includePrice: boolean;
  includeBarcode: boolean;
  includeCompany: boolean;
  includeCategory: boolean;
  format: "standard" | "compact";
  useMasterBarcode?: boolean;
}

export interface ProductForLabels {
  id: string;
  brand: string;
  model: string;
  price?: number;
  min_price?: number;
  max_price?: number;
  stock?: number;
  serial_numbers?: string[];
  category?: { name: string };
  year?: number;
  barcode?: string;
  storage?: number;
  ram?: number;
}

export interface LabelDataResult {
  success: boolean;
  labels: ThermalLabelData[];
  errors: string[];
  warnings: string[];
  stats: {
    totalProducts: number;
    totalLabels: number;
    unitsWithBarcodes: number;
    unitsMissingBarcodes: number;
    genericLabels: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}