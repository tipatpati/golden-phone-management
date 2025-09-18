import { ThermalPrintSettings } from "../types";

// Centralized configuration for thermal label printing
export const PRINT_SETTINGS: ThermalPrintSettings = {
  width: 227,   // 6cm at 96 DPI (6cm * 37.8 pixels/cm)
  height: 113,  // 3cm at 96 DPI (3cm * 37.8 pixels/cm)
  dpi: 96,      // Standard browser DPI
  margin: 0,    // No margins
};

// Unified barcode generation settings for 6cm × 3cm thermal labels
// Optimized for both scanner readability and WYSIWYG consistency
export const BARCODE_CONFIG = {
  format: 'CODE128' as const,
  width: 1.8,        // Optimized bar width for 6cm label
  height: 50,        // Scanner-friendly height with space for text
  displayValue: true,
  fontSize: 6,       // Compact text for 3cm height
  fontOptions: 'bold' as const,
  font: 'Arial',
  textAlign: 'center' as const,
  textPosition: 'bottom' as const,
  textMargin: 4,     // Adequate spacing for text visibility
  margin: 4,         // Quiet zones for scanner compliance
  background: '#ffffff',
  lineColor: '#000000',
  marginTop: 2,
  marginBottom: 2,
  marginLeft: 8,
  marginRight: 8,
} as const;
