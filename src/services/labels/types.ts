/**
 * Phase 1: Unified Types for Thermal Label System
 * Provides type safety and consistency across all label components
 */

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
  isSupplierLabel?: boolean;
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

/**
 * Enhanced type definitions for thermal printing system
 */
export interface ThermalPrintSettings {
  width: number;
  height: number;
  dpi: number;
  margin: number;
}

/**
 * Barcode quality contexts for different use cases
 */
export type BarcodeQualityContext = 'preview' | 'print' | 'thermal';

/**
 * Barcode configuration for specific quality context
 */
export interface BarcodeQualityConfig {
  width: number;
  height: number;
  fontSize: number;
  margin: number;
}

/**
 * Complete barcode configuration with all quality contexts
 */
export interface BarcodeConfig {
  format: 'CODE128';
  width: number;
  height: number;
  displayValue: boolean;
  fontSize: number;
  fontOptions: 'bold';
  font: string;
  textAlign: 'center';
  textPosition: 'bottom';
  textMargin: number;
  margin: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  background: string;
  lineColor: string;
  quality: {
    preview: BarcodeQualityConfig;
    print: BarcodeQualityConfig;
    thermal: BarcodeQualityConfig;
  };
}