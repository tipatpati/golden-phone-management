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
// Optimized for thermal printing with consistent quality across all contexts
export const BARCODE_CONFIG: BarcodeConfig = {
  // Core barcode settings
  format: 'CODE128' as const,
  width: 1.4,           // Reduced bar width for better fit
  height: 28,           // Reduced height for 3cm labels
  displayValue: true,
  
  // Typography optimized for thermal printing
  fontSize: 6,          // Smaller font for compact labels
  fontOptions: 'bold' as const,
  font: 'Arial, sans-serif',
  textAlign: 'center' as const,
  textPosition: 'bottom' as const,
  textMargin: 1,        // Minimal spacing for compact labels
  
  // Quiet zones for scanner compliance (ISO/IEC 15417)
  margin: 6,            // Minimum quiet zone
  marginTop: 2,
  marginBottom: 2,
  marginLeft: 6,        // Left quiet zone
  marginRight: 6,       // Right quiet zone
  
  // High contrast for thermal printing
  background: '#ffffff',
  lineColor: '#000000',
  
  // Quality settings for different contexts
  quality: {
    preview: {
      width: 1.4,
      height: 28,
      fontSize: 6,
      margin: 4,       // Reduced margin for preview
    },
    print: {
      width: 1.6,      // Slightly higher for crisp printing
      height: 32,      // Reduced height for better fit
      fontSize: 7,
      margin: 4,       // Reduced margin for print
    },
    thermal: {
      width: 1.4,      // Optimized for thermal printers
      height: 28,
      fontSize: 6,
      margin: 3,       // Minimal margin for compact thermal labels
    }
  }
} as const;
