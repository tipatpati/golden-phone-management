export interface ThermalLabelData {
  productName: string;
  serialNumber?: string;
  barcode: string;
  price: number;
  category?: string;
  color?: string;
  batteryLevel?: number;
}

export interface ThermalLabelOptions {
  copies: number;
  includePrice: boolean;
  includeBarcode: boolean;
  includeCompany: boolean;
  includeCategory: boolean;
  format: "standard" | "compact";
}

export interface ThermalPrintSettings {
  width: number;   // 6cm in pixels at 203 DPI ≈ 472px (landscape)
  height: number;  // 5cm in pixels at 203 DPI ≈ 400px (landscape)
  dpi: number;
  margin: number;
}