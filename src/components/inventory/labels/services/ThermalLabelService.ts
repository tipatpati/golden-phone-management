/**
 * Professional Thermal Label Service
 * Industry-standard thermal label generation and printing service
 * Supports 6cm x 5cm landscape labels at 203 DPI
 */

import { ThermalLabelData, ThermalLabelOptions, ThermalPrintSettings } from "../types";

export class ThermalLabelService {
  // Industry standard thermal printer settings for 6cm × 5cm labels
  private static readonly PRINT_SETTINGS: ThermalPrintSettings = {
    width: 472,   // 6cm at 203 DPI (landscape)
    height: 400,  // 5cm at 203 DPI (landscape)
    dpi: 203,
    margin: 16
  };

  // Barcode generation settings optimized for thermal printing
  private static readonly BARCODE_CONFIG = {
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
    lineColor: '#000000'
  };

  /**
   * Validates label data before processing
   */
  private static validateLabelData(labels: ThermalLabelData[]): void {
    if (!Array.isArray(labels) || labels.length === 0) {
      throw new Error('No valid labels provided for printing');
    }

    labels.forEach((label, index) => {
      if (!label.productName?.trim()) {
        throw new Error(`Label ${index + 1}: Product name is required`);
      }
      if (!label.barcode?.trim()) {
        throw new Error(`Label ${index + 1}: Barcode is required`);
      }
      if (typeof label.price !== 'number' || label.price < 0) {
        throw new Error(`Label ${index + 1}: Valid price is required`);
      }
    });
  }

  /**
   * Validates print options
   */
  private static validateOptions(options: ThermalLabelOptions): void {
    if (!options.copies || options.copies < 1 || options.copies > 50) {
      throw new Error('Copies must be between 1 and 50');
    }
    if (!['standard', 'compact'].includes(options.format)) {
      throw new Error('Format must be either "standard" or "compact"');
    }
  }

  /**
   * Generates CSS styles for thermal labels
   */
  private static generateLabelStyles(options: ThermalLabelOptions): string {
    const { width, height, margin } = this.PRINT_SETTINGS;
    
    return `
      @media print {
        @page {
          size: ${width + (margin * 2)}px ${height + (margin * 2)}px;
          margin: ${margin}px;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        
        .thermal-label {
          page-break-after: always;
          margin: 0 !important;
          padding: 10px !important;
          border: none !important;
        }
        
        .thermal-label:last-child {
          page-break-after: avoid;
        }
      }
      
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background: white;
      }
      
      .thermal-label {
        width: ${width}px;
        height: ${height}px;
        border: 1px solid #ddd;
        padding: 10px;
        text-align: center;
        background: white;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      
      .company-header {
        font-size: 11px;
        font-weight: bold;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }
      
      .product-name {
        font-size: ${options.format === 'compact' ? '15px' : '17px'};
        font-weight: bold;
        line-height: 1.2;
        margin-bottom: 6px;
        color: #000;
      }
      
      .battery-level {
        font-size: 10px;
        font-weight: 600;
        color: #16a34a;
        margin-bottom: 5px;
      }
      
      .serial-number {
        font-size: 11px;
        font-weight: 600;
        color: #000;
        margin-bottom: 5px;
      }
      
      .category {
        font-size: 10px;
        color: #666;
        margin-bottom: 5px;
      }
      
      .price {
        font-size: 18px;
        font-weight: bold;
        color: #dc2626;
        margin: 8px 0;
      }
      
      .barcode-container {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 1;
        min-height: 50px;
        margin-top: 6px;
      }
      
      .barcode-canvas {
        display: block;
        margin: 0 auto;
        max-width: 100%;
        height: auto;
      }
    `;
  }

  /**
   * Generates HTML content for a single thermal label
   */
  private static generateSingleLabel(
    label: ThermalLabelData, 
    options: ThermalLabelOptions & { companyName?: string }
  ): string {
    const elements: string[] = [];

    // Company header
    if (options.includeCompany && options.companyName?.trim()) {
      elements.push(`
        <div class="company-header">
          ${this.escapeHtml(options.companyName)}
        </div>
      `);
    }

    // Product name (required)
    elements.push(`
      <div class="product-name">
        ${this.escapeHtml(label.productName)}
      </div>
    `);

    // Battery level
    if (label.batteryLevel && label.batteryLevel > 0) {
      elements.push(`
        <div class="battery-level">
          Battery: ${label.batteryLevel}%
        </div>
      `);
    }

    // Serial number
    if (label.serialNumber?.trim()) {
      elements.push(`
        <div class="serial-number">
          ${this.escapeHtml(label.serialNumber)}
        </div>
      `);
    }

    // Category
    if (options.includeCategory && label.category?.trim()) {
      elements.push(`
        <div class="category">
          ${this.escapeHtml(label.category)}
        </div>
      `);
    }

    // Price
    if (options.includePrice && typeof label.price === 'number') {
      elements.push(`
        <div class="price">
          €${label.price.toFixed(2)}
        </div>
      `);
    }

    // Barcode
    if (options.includeBarcode && label.barcode?.trim()) {
      elements.push(`
        <div class="barcode-container">
          <canvas class="barcode-canvas" data-barcode="${this.escapeHtml(label.barcode)}"></canvas>
        </div>
      `);
    }

    return `
      <div class="thermal-label">
        ${elements.join('')}
      </div>
    `;
  }

  /**
   * Escapes HTML special characters for security
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generates JavaScript for barcode initialization
   */
  private static generateBarcodeScript(): string {
    const config = this.BARCODE_CONFIG;
    
    return `
      function initializeBarcodes() {
        if (typeof JsBarcode === 'undefined') {
          console.warn('JsBarcode library not loaded, retrying...');
          setTimeout(initializeBarcodes, 500);
          return;
        }
        
        const canvases = document.querySelectorAll('.barcode-canvas');
        console.log('Initializing barcodes for', canvases.length, 'elements');
        
        canvases.forEach(function(canvas, index) {
          const barcodeValue = canvas.getAttribute('data-barcode');
          if (!barcodeValue) {
            console.warn('No barcode value found for canvas', index);
            return;
          }
          
          try {
            JsBarcode(canvas, barcodeValue, ${JSON.stringify(config)});
            console.log('Barcode generated successfully for:', barcodeValue);
          } catch (error) {
            console.error('Barcode generation failed for:', barcodeValue, error);
            canvas.style.display = 'none';
          }
        });
      }
      
      function initiatePrint() {
        console.log('Initiating print process...');
        try {
          window.print();
        } catch (error) {
          console.error('Print initiation failed:', error);
          alert('Print failed. Please try using your browser\\'s print function (Ctrl+P)');
        }
      }
      
      window.addEventListener('load', function() {
        console.log('Document loaded, starting initialization...');
        initializeBarcodes();
        setTimeout(initiatePrint, 1500);
      });
    `;
  }

  /**
   * Main method to generate complete thermal label document
   */
  public static generateThermalLabels(
    labels: ThermalLabelData[],
    options: ThermalLabelOptions & { companyName?: string }
  ): string {
    try {
      // Validate inputs
      this.validateLabelData(labels);
      this.validateOptions(options);

      // Generate all label content
      const allLabelsHtml = labels
        .flatMap(label => 
          Array(options.copies).fill(null).map(() => 
            this.generateSingleLabel(label, options)
          )
        )
        .join('');

      // Generate complete HTML document
      return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Thermal Labels - 6cm × 5cm (Landscape)</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"></script>
            <style>
              ${this.generateLabelStyles(options)}
            </style>
          </head>
          <body>
            ${allLabelsHtml}
            <script>
              ${this.generateBarcodeScript()}
            </script>
          </body>
        </html>
      `;
    } catch (error) {
      console.error('Thermal label generation failed:', error);
      throw new Error(`Label generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Opens print dialog with generated labels
   */
  public static async printLabels(
    labels: ThermalLabelData[],
    options: ThermalLabelOptions & { companyName?: string }
  ): Promise<{ success: boolean; message: string; totalLabels: number }> {
    try {
      const htmlContent = this.generateThermalLabels(labels, options);
      const totalLabels = labels.length * options.copies;
      
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('Print popup was blocked. Please allow popups and try again.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      return {
        success: true,
        message: `Successfully prepared ${totalLabels} thermal labels for printing`,
        totalLabels
      };
    } catch (error) {
      console.error('Print operation failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Print operation failed',
        totalLabels: 0
      };
    }
  }
}