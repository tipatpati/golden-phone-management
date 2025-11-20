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
import { BarcodeRenderer } from '@/components/inventory/labels/services/BarcodeRenderer';
import { Services } from './Services';

export class UnifiedPrintService implements IPrintService {
  private readonly THERMAL_LABEL_STYLES = `
    /* Zone-based thermal label styles - WYSIWYG 6cm × 3cm */
    @page {
      size: 6cm 3cm portrait !important;
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
      width: 6cm;
      height: 3cm;
      margin: 0;
      padding: 0;
    }
    
    .thermal-label {
      width: 6cm;
      height: 3cm;
      border: none;
      margin: 0;
      padding: 0.8mm;
      box-shadow: none;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      background: white;
      color: #000;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }

    /* Zone 1: Header - 2mm */
    .label-header {
      height: 2mm;
      border-bottom: 0.1mm solid #e5e5e5;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .company-name {
      font-size: 1.3mm;
      font-weight: 700;
      text-transform: uppercase;
      color: #000;
      letter-spacing: 0.05mm;
      line-height: 1.0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Zone 2: Content - 9mm */
    .product-info {
      height: 9mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.3mm;
      overflow: hidden;
      padding: 0.2mm 0;
    }

    .product-name {
      font-size: 2mm;
      font-weight: 700;
      line-height: 1.0;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.03mm;
      max-height: 4mm;
      overflow: hidden;
      text-align: center;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      word-break: break-word;
    }

    .product-details {
      font-size: 1.4mm;
      font-weight: 500;
      color: #333;
      text-align: center;
      line-height: 1.0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .serial-number {
      font-size: 1.3mm;
      font-weight: 600;
      color: #000;
      text-align: center;
      letter-spacing: 0.03mm;
      line-height: 1.0;
    }

    .price {
      font-size: 3.5mm;
      font-weight: 700;
      color: #000;
      text-align: center;
      margin-top: 0.2mm;
      letter-spacing: 0.05mm;
      line-height: 1.0;
    }

    /* Zone 3: Barcode - 13mm (CODE128 compliant, optimized fit) */
    .barcode-container {
      height: 13mm;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #ffffff;
      overflow: visible;
      margin-top: 0.3mm;
      padding: 0 0.5mm;
    }

    .barcode-svg {
      max-width: 100%;
      height: 11mm;
      display: block;
    }
    
    /* Phase 4: Enhanced print quality optimizations */
    .thermal-label * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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
        <style>${this.THERMAL_LABEL_STYLES}</style>
      </head>
      <body>
        <div class="label-container">${labelsHTML}</div>
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
    
    const componentOptions = {
      copies: options.copies || 1,
      includePrice: options.showPrice !== false,
      includeBarcode: true,
      includeCompany: !!options.companyName,
      includeCategory: false,
      format: "standard" as const,
      companyName: options.companyName,
      isSupplierLabel: options.isSupplierLabel
    };
    
    // Use the same formatter as the preview to ensure consistency
    const formattedLabel = formatLabelElements(label, componentOptions);
    
    console.log('🖨️ UnifiedPrintService: Formatted label result:', {
      productName: formattedLabel.productName,
      price: formattedLabel.price,
      maxPrice: formattedLabel.maxPrice,
      priceDisplayed: formattedLabel.price || 'NO PRICE'
    });
    
    // Use formatted price from the same formatter as preview
    const priceString = formattedLabel.price || '';
    
    return `
      <div class="thermal-label">
        <!-- Zone 1: Header -->
        <div class="label-header">
          ${formattedLabel.companyName ? `
            <div class="company-name">${this.escapeHtml(formattedLabel.companyName)}</div>
          ` : ''}
        </div>

        <!-- Zone 2: Content -->
        <div class="product-info">
          <!-- Product Name - 14px bold, max 2 lines -->
          <div class="product-name">
            ${this.escapeHtml(formattedLabel.productName)}
          </div>
          
          <!-- Specifications - 10px medium, single line with bullet separators -->
          ${(formattedLabel.storage || formattedLabel.ram || formattedLabel.batteryLevel) ? `
            <div class="product-details">
              ${[formattedLabel.storage, formattedLabel.ram, formattedLabel.batteryLevel]
                .filter(Boolean)
                .join(' • ')}
            </div>
          ` : ''}
          
          <!-- Serial Number - 8px condensed -->
          ${formattedLabel.serialNumber ? `
            <div class="serial-number">${this.escapeHtml(formattedLabel.serialNumber)}</div>
          ` : ''}

          <!-- Price - 18px bold, prominent -->
          ${options.showPrice !== false && priceString ? `
            <div class="price">${priceString}</div>
          ` : ''}
        </div>

        <!-- Zone 3: Barcode with proper quiet zones -->
        ${formattedLabel.barcode ? `
          <div class="barcode-container">
            ${this.generateBarcodeForPrint(formattedLabel.barcode)}
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
  /**
   * Generate SVG barcode for print (unified with preview)
   */
  private generateBarcodeForPrint(barcode: string): string {
    try {
      return BarcodeRenderer.generateThermalPrint(barcode);
    } catch (error) {
      console.error('Failed to generate barcode for print:', error);
      return `
        <svg width="200" height="50" xmlns="http://www.w3.org/2000/svg" class="barcode-svg">
          <rect width="200" height="50" fill="#ffebee" stroke="#f44336" stroke-width="1"/>
          <text x="100" y="20" text-anchor="middle" font-family="Arial" font-size="10" fill="#d32f2f">
            Barcode Error
          </text>
          <text x="100" y="35" text-anchor="middle" font-family="monospace" font-size="8" fill="#666">
            ${barcode}
          </text>
        </svg>
      `;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}