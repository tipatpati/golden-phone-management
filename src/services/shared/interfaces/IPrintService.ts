/**
 * Print Service Interfaces
 * Defines contracts for printing services across the application
 */

export interface PrintOptions {
  copies?: number;
  paperSize?: 'A4' | '6x5cm' | 'custom';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  quality?: 'draft' | 'normal' | 'high';
  colorMode?: 'color' | 'grayscale' | 'black-white';
}

export interface ThermalLabelData {
  id: string;
  productName: string;
  brand: string;
  model: string;
  price: number;
  barcode: string;
  serial?: string;
  color?: string;
  storage?: string;
  ram?: string;
  batteryLevel?: number;
}

export interface ThermalLabelOptions extends PrintOptions {
  companyName?: string;
  showPrice?: boolean;
  showSerial?: boolean;
  labelSize?: '6x5cm' | '6x4cm' | '5x3cm';
  dpi?: 203 | 300;
}

export interface PrintResult {
  success: boolean;
  message: string;
  totalLabels?: number;
  printJobId?: string;
  error?: Error;
}

/**
 * Interface for thermal label printing
 */
export interface IThermalLabelService {
  /**
   * Generate thermal label HTML
   */
  generateLabelHTML(
    labels: ThermalLabelData[],
    options: ThermalLabelOptions
  ): string;
  
  /**
   * Print thermal labels
   */
  printLabels(
    labels: ThermalLabelData[],
    options: ThermalLabelOptions
  ): Promise<PrintResult>;
  
  /**
   * Generate single label HTML
   */
  generateSingleLabel(
    label: ThermalLabelData,
    options: ThermalLabelOptions
  ): string;
  
  /**
   * Validate label data
   */
  validateLabelData(labels: ThermalLabelData[]): {
    isValid: boolean;
    errors: string[];
  };
}

/**
 * Interface for document printing
 */
export interface IDocumentPrintService {
  /**
   * Print document from HTML
   */
  printHTML(html: string, options: PrintOptions): Promise<PrintResult>;
  
  /**
   * Print document from URL
   */
  printURL(url: string, options: PrintOptions): Promise<PrintResult>;
  
  /**
   * Generate PDF from HTML
   */
  generatePDF(html: string, options: PrintOptions): Promise<Blob>;
  
  /**
   * Preview document before printing
   */
  preview(html: string): Promise<string>;
}

/**
 * Combined print service interface
 */
export interface IPrintService extends IThermalLabelService, IDocumentPrintService {
  /**
   * Check printer availability
   */
  checkPrinterStatus(): Promise<{
    available: boolean;
    printers: string[];
    defaultPrinter?: string;
  }>;
  
  /**
   * Get supported print formats
   */
  getSupportedFormats(): string[];
  
  /**
   * Health check for print service
   */
  healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }>;
}