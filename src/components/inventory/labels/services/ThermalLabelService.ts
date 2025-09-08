/**
 * Professional Thermal Label Service
 * Industry-standard thermal label generation and printing service
 * Supports 6cm x 5cm landscape labels at 203 DPI
 */

import { ThermalLabelData, ThermalLabelOptions, ThermalPrintSettings } from "../types";
import { PRINT_SETTINGS, BARCODE_CONFIG } from "./config";
import { generateLabelStyles as buildLabelStyles } from "./styles";
import { generateSingleLabel as renderSingleLabel } from "./templates";
import { generateBarcodeScript as buildBarcodeScript } from "./scripts";
import { validateLabelData as validateData, validateOptions as validateOpts } from "./validators";
import { escapeHtml as escape } from "./utils";

export class ThermalLabelService {
  // Industry standard thermal printer settings for 6cm × 5cm labels
  // Using externalized PRINT_SETTINGS from config.ts

  // Barcode generation settings optimized for thermal printing
  // Using externalized BARCODE_CONFIG from config.ts

  /**
   * Validates label data before processing
   */
  private static validateLabelData(labels: ThermalLabelData[]): void {
    validateData(labels);
  }

  /**
   * Validates print options
   */
  private static validateOptions(options: ThermalLabelOptions): void {
    validateOpts(options);
  }

  /**
   * Generates CSS styles for thermal labels
   */
  private static generateLabelStyles(options: ThermalLabelOptions): string {
    return buildLabelStyles(options);
  }

  /**
   * Generates HTML content for a single thermal label
   */
  private static generateSingleLabel(
    label: ThermalLabelData,
    options: ThermalLabelOptions & { companyName?: string }
  ): string {
    return renderSingleLabel(label, options);
  }

  /**
   * Escapes HTML special characters for security
   */
  private static escapeHtml(text: string): string {
    return escape(text);
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
      validateData(labels);
      validateOpts(options);

      // Generate all label content
      const allLabelsHtml = labels
        .flatMap(label => Array(options.copies).fill(null).map(() => renderSingleLabel(label, options)))
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
              ${buildLabelStyles(options)}
            </style>
          </head>
          <body>
            ${allLabelsHtml}
            <script>
              ${buildBarcodeScript(BARCODE_CONFIG)}
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
   * Converts barcode canvas to base64 image for reliable printing
   */
  private static convertBarcodeToImage(canvas: HTMLCanvasElement): string {
    try {
      return canvas.toDataURL('image/png', 1.0);
    } catch (error) {
      console.error('Failed to convert barcode to image:', error);
      return '';
    }
  }

  /**
   * Waits for all barcodes to render as images before printing
   */
  private static waitForBarcodeImages(printWindow: Window): Promise<void> {
    return new Promise((resolve) => {
      const checkBarcodes = () => {
        const canvases = printWindow.document.querySelectorAll('.barcode-canvas') as NodeListOf<HTMLCanvasElement>;
        const allRendered = Array.from(canvases).every(canvas => {
          return canvas.width > 0 && canvas.height > 0;
        });

        if (allRendered || canvases.length === 0) {
          // Convert all canvas barcodes to images for better print reliability
          canvases.forEach(canvas => {
            const imageData = this.convertBarcodeToImage(canvas);
            if (imageData) {
              const img = printWindow.document.createElement('img');
              img.src = imageData;
              img.style.cssText = canvas.style.cssText;
              img.className = canvas.className;
              canvas.parentNode?.replaceChild(img, canvas);
            }
          });
          resolve();
        } else {
          setTimeout(checkBarcodes, 100);
        }
      };

      setTimeout(checkBarcodes, 500);
    });
  }

  /**
   * Opens print dialog with generated labels using single-source approach
   */
  public static async printLabels(
    labels: ThermalLabelData[],
    options: ThermalLabelOptions & { companyName?: string }
  ): Promise<{ success: boolean; message: string; totalLabels: number }> {
    try {
      // Generate the exact same HTML content as preview
      const htmlContent = this.generateThermalLabels(labels, options);
      const totalLabels = labels.length * options.copies;
      
      // Use the unified capture-and-convert approach for consistent output
      try {
        const response = await fetch(`https://joiwowvlujajwbarpsuc.supabase.co/functions/v1/capture-and-convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: htmlContent,
            type: 'html', // Keep as HTML for direct printing
            filename: `thermal-labels-${Date.now()}`
          })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          // Create print window with the processed content
          const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=no,resizable=no');
          
          if (!printWindow) {
            throw new Error('Print popup was blocked. Please allow popups and try again.');
          }

          printWindow.location.href = url;
          
          // Wait for content to load then print
          printWindow.addEventListener('load', () => {
            setTimeout(() => {
              printWindow.print();
              window.URL.revokeObjectURL(url);
            }, 1000);
          });

          return {
            success: true,
            message: `Successfully prepared ${totalLabels} thermal labels for printing`,
            totalLabels
          };
        }
      } catch (serviceError) {
        console.warn('Unified service failed, falling back to direct printing:', serviceError);
      }

      // Fallback to direct printing if service fails
      const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=no,resizable=no');
      
      if (!printWindow) {
        throw new Error('Print popup was blocked. Please allow popups and try again.');
      }

      // Write content and prepare for printing
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load and barcodes to render
      await new Promise(resolve => {
        if (printWindow.document.readyState === 'complete') {
          resolve(void 0);
        } else {
          printWindow.addEventListener('load', () => resolve(void 0));
        }
      });

      // Additional delay to ensure barcode library loads and renders
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Wait for barcodes to be converted to images
      await this.waitForBarcodeImages(printWindow);

      // Final delay before initiating print
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (printError) {
          console.error('Print initiation failed:', printError);
          alert('Print failed. Please try using your browser\'s print function (Ctrl+P)');
        }
      }, 500);

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