/**
 * Unified Print Service - Production Ready
 * Consolidates all print functionality into a single, reliable service
 */

import type { 
  IPrintService, 
  ThermalLabelData, 
  ThermalLabelOptions, 
  PrintOptions, 
  PrintResult 
} from '../shared/interfaces/IPrintService';
import { logger } from '@/utils/logger';
import { formatLabelElements } from '@/components/inventory/labels/services/labelDataFormatter';
import { Services } from './Services';

export class UnifiedPrintService implements IPrintService {
  private readonly THERMAL_LABEL_STYLES = `
    /* Unified styles - WYSIWYG: same size for preview and print */
    @page {
      size: 6cm 5cm !important;
      margin: 0mm !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      font-family: system-ui, -apple-system, sans-serif !important;
      background: white !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    .label-container {
      width: 5.5cm;
      height: 4.5cm;
      margin: 0;
      padding: 0;
    }
    
    .thermal-label {
      width: 5cm;
      height: 4cm;
      border: none;
      border-radius: 0;
      margin: 0;
      padding: 2mm;
      box-shadow: none;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-sizing: border-box;
      font-size: 2.8mm;
      gap: 1mm;
      background: white;
      color: #000;
      text-align: center;
      line-height: 1.1;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }

    .label-header {
      min-height: 3mm;
      border-bottom: 0.2mm solid #e5e5e5;
      padding-bottom: 0.5mm;
      margin-bottom: 1mm;
      overflow: hidden;
    }

    .company-name {
      font-size: 2.2mm;
      font-weight: 700;
      text-transform: uppercase;
      color: #000;
      letter-spacing: 0.1mm;
      line-height: 1.0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 0.5mm;
      min-height: 0;
      overflow: hidden;
    }

    .product-name {
      font-size: 4mm;
      font-weight: 800;
      line-height: 1.0;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.1mm;
      max-height: 15mm;
      overflow: hidden;
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      word-break: break-word;
      hyphens: auto;
    }

    .product-details {
      font-size: 3mm;
      font-weight: 600;
      margin-top: 0.5mm;
      color: #333;
      line-height: 1.0;
    }

    .serial-number {
      font-size: 2.5mm;
      font-weight: 600;
      color: #000;
      text-align: center;
      letter-spacing: 0.1mm;
    }

    .price {
      font-size: 7mm;
      font-weight: 900;
      color: #000;
      text-align: center;
      padding: 1mm 0;
      margin-bottom: 1mm;
      letter-spacing: 0.2mm;
      line-height: 1.0;
    }

    .barcode-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 12mm;
      max-height: 12mm;
      background: #ffffff;
      padding: 1mm;
      overflow: hidden;
    }

    .barcode-canvas {
      max-width: 50mm;
      height: 10mm;
      display: block;
    }
  `;

  /**
   * Generate thermal label HTML
   */
  generateLabelHTML(labels: ThermalLabelData[], options: ThermalLabelOptions): string {
    const validation = this.validateLabelData(labels);
    if (!validation.isValid) {
      throw new Error(`Invalid label data: ${validation.errors.join(', ')}`);
    }

    const labelsHTML = labels.flatMap(label => 
      Array(options.copies || 1).fill(null).map(() => this.generateSingleLabel(label, options))
    ).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Thermal Labels</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"></script>
        <style>${this.THERMAL_LABEL_STYLES}</style>
      </head>
      <body>
        <div class="label-container">${labelsHTML}</div>
        <script>
           function generateBarcodes() {
             const canvases = document.querySelectorAll('.barcode-canvas');
             canvases.forEach(canvas => {
               const barcode = canvas.getAttribute('data-barcode');
               if (barcode && window.JsBarcode) {
                 try {
                    // Unified barcode settings for WYSIWYG
                    JsBarcode(canvas, barcode, {
                      format: 'CODE128',
                      width: 1.8,
                      height: 28,
                      displayValue: true,
                      fontSize: 8,
                      fontOptions: 'bold',
                      font: 'Arial',
                      textAlign: 'center',
                      textPosition: 'bottom',
                      textMargin: 2,
                      margin: 2,
                      background: '#ffffff',
                      lineColor: '#000000',
                      marginTop: 1,
                      marginBottom: 1,
                      marginLeft: 3,
                      marginRight: 3
                    });
                 } catch (error) {
                   console.error('Barcode generation failed:', error);
                 }
               }
             });
           }
            
            window.addEventListener('load', generateBarcodes);
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
      logger.info('Starting thermal label print operation', { 
        labelCount: labels.length, 
        copies: options.copies 
      }, 'UnifiedPrintService');

      const html = this.generateLabelHTML(labels, options);
      const totalLabels = labels.length * (options.copies || 1);
      
      const printWindow = window.open('', '_blank', 'width=300,height=250');
      if (!printWindow) {
        throw new Error('Print popup blocked. Please allow popups.');
      }

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for resources to load then show print preview
      setTimeout(() => {
        printWindow.focus();
        printWindow.print(); // This will show print preview dialog
      }, 2000);

      logger.info('Thermal labels prepared for printing successfully', { totalLabels }, 'UnifiedPrintService');

      return {
        success: true,
        message: `Successfully prepared ${totalLabels} thermal labels for printing`,
        totalLabels
      };
    } catch (error) {
      logger.error('Thermal label print operation failed', error, 'UnifiedPrintService');
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Print operation failed',
        totalLabels: 0,
        error: error as Error
      };
    }
  }

  /**
   * Generate single label HTML with barcode integrity validation
   */
  generateSingleLabel(label: ThermalLabelData, options: ThermalLabelOptions): string {
    // BARCODE INTEGRITY CHECK - Verify barcode before printing
    const barcodeAuthority = Services.getBarcodeAuthority();
    const barcodeToUse = label.barcode;
    
    console.log(`🖨️ UnifiedPrintService: Preparing to print barcode ${barcodeToUse}`);
    
    // Validate barcode integrity
    if (barcodeToUse) {
      const validation = barcodeAuthority.validateBarcode(barcodeToUse);
      if (!validation.isValid) {
        console.error(`❌ UnifiedPrintService: Invalid barcode ${barcodeToUse}:`, validation.errors);
        throw new Error(`Cannot print invalid barcode: ${validation.errors.join(', ')}`);
      }
      
      // Verify barcode contract if available
      const contract = barcodeAuthority.getBarcodeContract(barcodeToUse);
      if (contract) {
        console.log(`✅ UnifiedPrintService: Barcode contract verified`, {
          barcode: barcodeToUse,
          source: contract.source,
          traceId: contract.traceId
        });
        
        // Ensure barcode integrity is maintained
        if (!barcodeAuthority.verifyBarcodeIntegrity(barcodeToUse)) {
          throw new Error(`Barcode integrity check failed for ${barcodeToUse}`);
        }
      } else {
        console.warn(`⚠️ UnifiedPrintService: No contract found for barcode ${barcodeToUse} (may be legacy)`);
      }
      
      console.log(`🔍 UnifiedPrintService: Final barcode integrity check passed for ${barcodeToUse}`);
    }
    // Convert the interface types to match the component types with proper battery level
    const componentLabel = {
      productName: label.productName,
      serialNumber: label.serial,
      barcode: label.barcode,
      price: label.price,
      category: undefined,
      color: label.color,
      batteryLevel: label.batteryLevel, // Now properly typed
      storage: label.storage ? parseInt(label.storage.replace(/\D/g, '')) || undefined : undefined,
      ram: label.ram ? parseInt(label.ram.replace(/\D/g, '')) || undefined : undefined
    };
    
    const componentOptions = {
      copies: options.copies || 1,
      includePrice: options.showPrice !== false,
      includeBarcode: true,
      includeCompany: !!options.companyName,
      includeCategory: false,
      format: "standard" as const,
      companyName: options.companyName
    };
    
    // Use the same formatter as the preview to ensure consistency
    const formattedLabel = formatLabelElements(componentLabel, componentOptions);
    
    // Calculate display price exactly like in preview  
    const displayPrice = (label as any).maxPrice !== undefined && (label as any).maxPrice !== null ? (label as any).maxPrice : label.price;
    const priceString = typeof displayPrice === 'number' ? `€${displayPrice.toFixed(2)}` : '€0.00';
    
    return `
      <div class="thermal-label">
        <!-- Header Section -->
        <div class="label-header">
          ${formattedLabel.companyName ? `
            <div class="company-name">${this.escapeHtml(formattedLabel.companyName)}</div>
          ` : ''}
        </div>

        <!-- Main Content Section -->
        <div class="product-info">
          <!-- Product Name with Storage/RAM/Battery - Primary focus -->
          <div class="product-name">
            ${this.escapeHtml(formattedLabel.productName)}
            ${(formattedLabel.storage || formattedLabel.ram || formattedLabel.batteryLevel) ? `
              <div class="product-details">
                ${formattedLabel.storage || ''}${formattedLabel.storage && (formattedLabel.ram || formattedLabel.batteryLevel) ? ' • ' : ''}${formattedLabel.ram || ''}${formattedLabel.ram && formattedLabel.batteryLevel ? ' • ' : ''}${formattedLabel.batteryLevel || ''}
              </div>
            ` : ''}
          </div>
          
          <!-- Serial Number Section -->
          ${formattedLabel.serialNumber ? `
            <div class="serial-number">${this.escapeHtml(formattedLabel.serialNumber)}</div>
          ` : ''}
        </div>

        <!-- Price Section -->
        ${options.showPrice !== false ? `
          <div class="price">${priceString}</div>
        ` : ''}

        <!-- Barcode Section -->
        ${formattedLabel.barcode ? `
          <div class="barcode-container">
            <canvas class="barcode-canvas" data-barcode="${this.escapeHtml(formattedLabel.barcode)}"></canvas>
          </div>
        ` : ''}
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
      if (!label.barcode?.trim()) {
        errors.push(`Label ${index + 1}: Barcode is required`);
      }
      if (label.price !== undefined && (typeof label.price !== 'number' || label.price < 0)) {
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
    throw new Error('PDF generation not implemented in browser environment');
  }

  /**
   * Preview document before printing
   */
  async preview(html: string): Promise<string> {
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

  /**
   * Escape HTML special characters for security
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}