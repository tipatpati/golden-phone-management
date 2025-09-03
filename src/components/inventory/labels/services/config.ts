import { ThermalPrintSettings } from "../types";

// Centralized configuration for thermal label printing
export const PRINT_SETTINGS: ThermalPrintSettings = {
  width: 226,   // 6cm at 96 DPI (standard browser DPI)
  height: 189,  // 5cm at 96 DPI (standard browser DPI)
  dpi: 96,      // Standard browser DPI for consistent printing
  margin: 0,    // No margins for precise sticker alignment
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
