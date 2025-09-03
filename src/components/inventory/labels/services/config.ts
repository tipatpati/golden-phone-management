import { ThermalPrintSettings } from "../types";

// Centralized configuration for thermal label printing
export const PRINT_SETTINGS: ThermalPrintSettings = {
  width: 180,   // Smaller width for better fit
  height: 150,  // Smaller height for better fit
  dpi: 96,      // Standard browser DPI
  margin: 0,    // No margins
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
