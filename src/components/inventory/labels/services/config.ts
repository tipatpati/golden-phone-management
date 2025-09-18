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
  width: 1.8,           // Optimal bar width for 6cm thermal labels
  height: 36,           // Perfect height for 3cm labels with text
  displayValue: true,
  
  // Typography optimized for thermal printing
  fontSize: 8,          // Readable on thermal printers
  fontOptions: 'bold' as const,
  font: 'Arial, sans-serif',
  textAlign: 'center' as const,
  textPosition: 'bottom' as const,
  textMargin: 2,        // Tight spacing for compact labels
  
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
      width: 1.6,
      height: 32,
      fontSize: 7,
      margin: 6,       // Standard margin for preview
    },
    print: {
      width: 2.0,      // Higher resolution for crisp printing
      height: 40,      // Extra height for better scanning
      fontSize: 8,
      margin: 6,       // Standard margin for print
    },
    thermal: {
      width: 1.8,      // Optimized for thermal printers
      height: 36,
      fontSize: 8,
      margin: 4,       // Reduced margin for compact thermal labels
    }
  }
} as const;
