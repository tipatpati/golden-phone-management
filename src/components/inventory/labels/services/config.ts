import type { ThermalPrintSettings, BarcodeConfig } from "@/services/labels/types";

/**
 * Phase 1: Unified Configuration for Thermal Labels
 * Single source of truth for all barcode and label settings
 * Ensures WYSIWYG consistency between preview and print
 */

// Standard thermal label dimensions in millimeters (real-world units)
export const THERMAL_LABEL_DIMENSIONS = {
  width: 60,     // 6cm width
  height: 30,    // 3cm height
  dpi: 203,      // Standard thermal printer DPI (8 dots/mm)
} as const;

// Convert to pixels for browser rendering (96 DPI standard)
export const PRINT_SETTINGS: ThermalPrintSettings = {
  width: Math.round(THERMAL_LABEL_DIMENSIONS.width * 96 / 25.4),  // 227px
  height: Math.round(THERMAL_LABEL_DIMENSIONS.height * 96 / 25.4), // 113px
  dpi: 96,
  margin: 0,
};

// Phase 2: Enhanced Barcode Configuration
// CODE128 ISO/IEC 15417 Compliant - Optimized for thermal printing
export const BARCODE_CONFIG: BarcodeConfig = {
  // Core barcode settings - ISO/IEC 15417 compliant
  format: 'CODE128' as const,
  width: 2.0,           // Standard bar width for reliable scanning
  height: 50,           // Meets 15% length requirement and 0.25" minimum
  displayValue: true,
  
  // Typography optimized for thermal printing
  fontSize: 10,         // Readable on thermal labels
  fontOptions: 'bold' as const,
  font: 'Arial, sans-serif',
  textAlign: 'center' as const,
  textPosition: 'bottom' as const,
  textMargin: 2,
  
  // ISO/IEC 15417 compliant quiet zones (10X minimum = 10 * 2.0 = 20px)
  margin: 20,           // 10X quiet zone for reliable scanning
  marginTop: 4,
  marginBottom: 4,
  marginLeft: 20,       // Left quiet zone
  marginRight: 20,      // Right quiet zone
  
  // High contrast for thermal printing
  background: '#ffffff',
  lineColor: '#000000',
  
  // Quality settings for different contexts - all standards compliant
  quality: {
    preview: {
      width: 2.0,       // Standard compliant
      height: 45,       // Slightly smaller for preview
      fontSize: 9,
      margin: 18,       // 9X quiet zone for preview
    },
    print: {
      width: 2.2,       // Slightly thicker for print quality
      height: 55,       // Taller for print documents
      fontSize: 11,
      margin: 22,       // 10X quiet zone for print
    },
    thermal: {
      width: 2.0,       // Standard for thermal printers
      height: 50,       // ISO compliant minimum
      fontSize: 10,     // Clear on thermal paper
      margin: 20,       // Full 10X quiet zone
    }
  }
} as const;
