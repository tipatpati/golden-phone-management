/**
 * Injectable Print Service Implementation
 * Handles thermal label printing and document printing with proper DI support
 */

import type { 
  IPrintService, 
  ThermalLabelData, 
  ThermalLabelOptions, 
  PrintOptions, 
  PrintResult 
} from './interfaces/IPrintService';

export class PrintService implements IPrintService {
  private readonly THERMAL_LABEL_STYLES = `
    /* Thermal Label Styles for 6cm x 5cm landscape at 203 DPI */
    @media print {
      @page {
        size: 6cm 5cm;
        margin: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        background: white;
      }
    }

    .thermal-label {
      width: 5.8cm;
      height: 4.8cm;
      padding: 1mm;
      margin: 0;
      box-sizing: border-box;
      border: 1px solid #ddd;
      background: white;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    .label-header {
      text-align: center;
      margin-bottom: 2px;
    }

    .company-name {
      font-size: 8px;
      font-weight: bold;
      margin: 0;
      line-height: 1;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }

    .product-name {
      font-size: 9px;
      font-weight: bold;
      margin: 0 0 1px 0;
      line-height: 1.1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-details {
      font-size: 7px;
      margin: 0;
      line-height: 1.1;
      color: #666;
    }

    .price {
      font-size: 11px;
      font-weight: bold;
      margin: 2px 0;
      text-align: center;
    }

    .barcode-container {
      text-align: center;
      margin-top: 1px;
    }

    .barcode-placeholder {
      background: #f0f0f0;
      border: 1px dashed #999;
      height: 20px;
      line-height: 20px;
      font-size: 8px;
      color: #666;
      margin: 0 auto;
      width: 80%;
    }

    /* Remove last page break */
    .thermal-label:last-child {
      page-break-after: avoid;
    }
  `;

  /**
   * Generate thermal label HTML
   */
  generateLabelHTML(labels: ThermalLabelData[], options: ThermalLabelOptions): string {
    const labelsHTML = labels.map(label => this.generateSingleLabel(label, options)).join('\n');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Thermal Labels</title>
        <style>${this.THERMAL_LABEL_STYLES}</style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        ${labelsHTML}
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            try {
              document.querySelectorAll('.barcode-canvas').forEach(function(canvas) {
                const barcode = canvas.dataset.barcode;
                if (barcode && window.JsBarcode) {
                  JsBarcode(canvas, barcode, {
                    format: 'CODE128',
                    width: 1.2,
                    height: 20,
                    displayValue: false,
                    margin: 0,
                    background: '#ffffff',
                    lineColor: '#000000'
                  });
                }
              });
            } catch (error) {
              console.error('Failed to generate barcodes:', error);
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Print thermal labels
   */
  async printLabels(labels: ThermalLabelData[], options: ThermalLabelOptions): Promise<PrintResult> {
    try {
      // Validate label data first
      const validation = this.validateLabelData(labels);
      if (!validation.isValid) {
        return {
          success: false,
          message: `Invalid label data: ${validation.errors.join(', ')}`,
          totalLabels: 0
        };
      }

      const html = this.generateLabelHTML(labels, options);
      
      // Create print window
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups.');
      }

      // Write HTML to print window
      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for resources to load
      await new Promise<void>((resolve) => {
        printWindow.addEventListener('load', () => {
          setTimeout(resolve, 1000); // Wait for barcode generation
        });
      });

      // Trigger print
      printWindow.print();

      // Close window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);

      return {
        success: true,
        message: `Successfully printed ${labels.length} thermal labels`,
        totalLabels: labels.length
      };
    } catch (error) {
      console.error('Print error:', error);
      return {
        success: false,
        message: `Print failed: ${(error as Error).message}`,
        totalLabels: 0,
        error: error as Error
      };
    }
  }

  /**
   * Generate single label HTML
   */
  generateSingleLabel(label: ThermalLabelData, options: ThermalLabelOptions): string {
    const companyName = options.companyName || 'GPMS';
    const showPrice = options.showPrice !== false;
    const showSerial = options.showSerial !== false;
    
    let productDetails = `${label.brand} ${label.model}`;
    if (label.color) productDetails += ` ${label.color}`;
    if (label.storage) productDetails += ` ${label.storage}GB`;
    if (label.ram) productDetails += ` ${label.ram}GB RAM`;
    if (showSerial && label.serial) productDetails += ` S/N: ${label.serial}`;

    return `
      <div class="thermal-label">
        <div class="label-header">
          <div class="company-name">${companyName}</div>
        </div>
        
        <div class="product-info">
          <div class="product-name">${label.productName}</div>
          <div class="product-details">${productDetails}</div>
          ${showPrice ? `<div class="price">$${label.price.toFixed(2)}</div>` : ''}
        </div>
        
        <div class="barcode-container">
          <canvas class="barcode-canvas" data-barcode="${label.barcode}"></canvas>
        </div>
      </div>
    `;
  }

  /**
   * Validate label data
   */
  validateLabelData(labels: ThermalLabelData[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!labels || labels.length === 0) {
      errors.push('No labels provided');
      return { isValid: false, errors };
    }

    labels.forEach((label, index) => {
      if (!label.productName?.trim()) {
        errors.push(`Label ${index + 1}: Product name is required`);
      }
      if (!label.brand?.trim()) {
        errors.push(`Label ${index + 1}: Brand is required`);
      }
      if (!label.model?.trim()) {
        errors.push(`Label ${index + 1}: Model is required`);
      }
      if (!label.barcode?.trim()) {
        errors.push(`Label ${index + 1}: Barcode is required`);
      }
      if (typeof label.price !== 'number' || label.price < 0) {
        errors.push(`Label ${index + 1}: Valid price is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Print document from HTML
   */
  async printHTML(html: string, options: PrintOptions): Promise<PrintResult> {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      printWindow.document.write(html);
      printWindow.document.close();

      await new Promise<void>((resolve) => {
        printWindow.addEventListener('load', () => {
          setTimeout(resolve, 500);
        });
      });

      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);

      return {
        success: true,
        message: 'Document printed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Print failed: ${(error as Error).message}`,
        error: error as Error
      };
    }
  }

  /**
   * Print document from URL
   */
  async printURL(url: string, options: PrintOptions): Promise<PrintResult> {
    try {
      const printWindow = window.open(url, '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Failed to open print window');
      }

      await new Promise<void>((resolve) => {
        printWindow.addEventListener('load', () => {
          setTimeout(resolve, 1000);
        });
      });

      printWindow.print();
      setTimeout(() => printWindow.close(), 1000);

      return {
        success: true,
        message: 'Document printed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Print failed: ${(error as Error).message}`,
        error: error as Error
      };
    }
  }

  /**
   * Generate PDF from HTML
   */
  async generatePDF(html: string, options: PrintOptions): Promise<Blob> {
    // For browser environments, we would use libraries like jsPDF or Puppeteer
    // This is a placeholder implementation
    throw new Error('PDF generation not implemented in browser environment');
  }

  /**
   * Preview document before printing
   */
  async preview(html: string): Promise<string> {
    // Return the HTML with preview styles
    return `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
        <div style="background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          ${html}
        </div>
      </div>
    `;
  }

  /**
   * Check printer availability
   */
  async checkPrinterStatus(): Promise<{
    available: boolean;
    printers: string[];
    defaultPrinter?: string;
  }> {
    // In browser environment, we can't directly access printer information
    // This would require a native app or browser extension
    return {
      available: typeof window !== 'undefined' && 'print' in window,
      printers: ['Default Printer'],
      defaultPrinter: 'Default Printer'
    };
  }

  /**
   * Get supported print formats
   */
  getSupportedFormats(): string[] {
    return ['HTML', 'Thermal Labels'];
  }

  /**
   * Health check for print service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const printerStatus = await this.checkPrinterStatus();
      
      return {
        status: printerStatus.available ? 'healthy' : 'degraded',
        details: {
          printAvailable: printerStatus.available,
          supportedFormats: this.getSupportedFormats(),
          printers: printerStatus.printers
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }
}