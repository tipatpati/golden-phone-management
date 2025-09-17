import { ThermalPrintSettings } from "../types";

// Centralized configuration for thermal label printing
export const PRINT_SETTINGS: ThermalPrintSettings = {
  width: 227,   // 6cm at 96 DPI (6cm * 37.8 pixels/cm)
  height: 113,  // 3cm at 96 DPI (3cm * 37.8 pixels/cm)
  dpi: 96,      // Standard browser DPI
  margin: 0,    // No margins
};

// Barcode generation settings optimized for thermal printing
export const BARCODE_CONFIG = {
  format: 'CODE128' as const,
  width: 1.5,
  height: 35,
  displayValue: true,
  fontSize: 8,
  font: 'Arial',
  textAlign: 'center' as const,
  textPosition: 'bottom' as const,
  margin: 2,
  background: '#ffffff',
  lineColor: '#000000',
} as const;
