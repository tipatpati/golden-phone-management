import { ThermalPrintSettings } from "../types";

// Centralized configuration for thermal label printing
export const PRINT_SETTINGS: ThermalPrintSettings = {
  width: 472,   // 6cm at 203 DPI (landscape)
  height: 400,  // 5cm at 203 DPI (landscape)
  dpi: 203,
  margin: 16,
};

// Barcode generation settings optimized for thermal printing
export const BARCODE_CONFIG = {
  format: 'CODE128' as const,
  width: 1.6,
  height: 50,
  displayValue: true,
  fontSize: 11,
  font: 'Arial',
  textAlign: 'center' as const,
  textPosition: 'bottom' as const,
  margin: 6,
  background: '#ffffff',
  lineColor: '#000000',
} as const;
