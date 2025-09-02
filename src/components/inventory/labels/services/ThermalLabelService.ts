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
          padding: 8px !important;
          border: 2px solid #e5e5e5 !important;
          border-radius: 4px !important;
        }
        
        .thermal-label:last-child {
          page-break-after: avoid;
        }
      }
      
      body {
        font-family: system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 20px;
        background: white;
      }
      
      .thermal-label {
        width: ${width}px;
        height: ${height}px;
        border: 2px solid #e5e5e5;
        border-radius: 4px;
        padding: 8px;
        background: white;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-bottom: 20px;
        page-break-inside: avoid;
        position: relative;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .label-header {
        min-height: 25px;
        border-bottom: 1px solid #e5e5e5;
        padding-bottom: 4px;
        margin-bottom: 6px;
        text-align: center;
      }
      
      .company-header {
        font-size: 9px;
        font-weight: 700;
        color: #2563eb;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        line-height: 1.1;
      }
      
      .category-label {
        font-size: 8px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-top: 2px;
      }
      
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
      }
      
      .product-name {
        font-size: ${options.format === 'compact' ? '14px' : '16px'};
        font-weight: 800;
        line-height: 1.1;
        color: #000;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        max-height: 40px;
        overflow: hidden;
        text-align: center;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .product-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 9px;
        margin-top: 2px;
        gap: 4px;
      }
      
      .serial-number {
        font-size: 9px;
        font-weight: 600;
        color: #333;
        font-family: monospace;
        background-color: #f8f9fa;
        padding: 2px 4px;
        border-radius: 2px;
        border: 1px solid #e9ecef;
        white-space: nowrap;
      }
      
      .battery-level {
        font-size: 9px;
        font-weight: 600;
        padding: 2px 4px;
        border-radius: 2px;
        border: 1px solid;
        white-space: nowrap;
      }
      
      .battery-high {
        color: #16a34a;
        background-color: #f0f9ff;
        border-color: #e0f2fe;
      }
      
      .battery-medium {
        color: #ca8a04;
        background-color: #fefce8;
        border-color: #fef3c7;
      }
      
      .battery-low {
        color: #dc2626;
        background-color: #fef2f2;
        border-color: #fecaca;
      }
      
      .color-indicator {
        font-size: 8px;
        font-weight: 600;
        color: #555;
        text-align: center;
        background-color: #f8f9fa;
        padding: 2px 6px;
        border-radius: 3px;
        margin: 2px auto;
        text-transform: capitalize;
      }
      
      .price-section {
        font-size: 20px;
        font-weight: 900;
        color: #2563eb;
        text-align: center;
        padding: 6px 0;
        border-top: 2px solid #2563eb;
        border-bottom: 1px solid #e5e5e5;
        margin-bottom: 6px;
        background-color: #f8fafc;
        letter-spacing: 0.5px;
      }
      
      .barcode-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 45px;
        background-color: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 2px;
        padding: 2px;
      }
      
      .barcode-canvas {
        display: block;
        margin: 0 auto;
        max-width: 100%;
        height: auto;
      }
      
      .quality-indicator {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 8px;
        height: 8px;
        background-color: #2563eb;
        border-radius: 50%;
        opacity: 0.7;
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
    // Header section with company and category
    const headerElements: string[] = [];
    if (options.includeCompany && options.companyName?.trim()) {
      headerElements.push(`
        <div class="company-header">
          ${this.escapeHtml(options.companyName)}
        </div>
      `);
    }
    if (options.includeCategory && label.category?.trim()) {
      headerElements.push(`
        <div class="category-label">
          ${this.escapeHtml(label.category)}
        </div>
      `);
    }

    // Product details section
    const detailsElements: string[] = [];
    if (label.serialNumber?.trim()) {
      detailsElements.push(`
        <div class="serial-number">
          SN: ${this.escapeHtml(label.serialNumber)}
        </div>
      `);
    }

    if (label.batteryLevel && label.batteryLevel > 0) {
      const batteryClass = label.batteryLevel > 80 ? 'battery-high' : 
                          label.batteryLevel > 50 ? 'battery-medium' : 'battery-low';
      detailsElements.push(`
        <div class="battery-level ${batteryClass}">
          🔋 ${label.batteryLevel}%
        </div>
      `);
    }

    // Color indicator
    let colorIndicator = '';
    if (label.color?.trim()) {
      colorIndicator = `
        <div class="color-indicator">
          Color: ${this.escapeHtml(label.color)}
        </div>
      `;
    }

    // Price section
    let priceSection = '';
    if (options.includePrice && typeof label.price === 'number') {
      priceSection = `
        <div class="price-section">
          €${label.price.toFixed(2)}
        </div>
      `;
    }

    // Barcode section
    let barcodeSection = '';
    if (options.includeBarcode && label.barcode?.trim()) {
      barcodeSection = `
        <div class="barcode-container">
          <canvas class="barcode-canvas" data-barcode="${this.escapeHtml(label.barcode)}"></canvas>
        </div>
      `;
    }

    return `
      <div class="thermal-label">
        <!-- Header Section -->
        <div class="label-header">
          ${headerElements.join('')}
        </div>

        <!-- Main Content Section -->
        <div class="main-content">
          <div class="product-name">
            ${this.escapeHtml(label.productName)}
          </div>
          
          <div class="product-details">
            ${detailsElements.join('')}
          </div>
          
          ${colorIndicator}
        </div>

        <!-- Price Section -->
        ${priceSection}

        <!-- Barcode Section -->
        ${barcodeSection}

        <!-- Quality Indicator -->
        <div class="quality-indicator"></div>
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