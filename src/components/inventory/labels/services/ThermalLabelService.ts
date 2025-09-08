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
   * NEW SINGLE-SOURCE APPROACH: Print labels using exact preview HTML
   */
  public static async printLabels(
    labels: ThermalLabelData[],
    options: ThermalLabelOptions & { companyName?: string }
  ): Promise<{ success: boolean; message: string; totalLabels: number }> {
    try {
      const totalLabels = labels.length * options.copies;

      // Generate the exact same HTML structure as the preview components
      const labelsHTML = labels.flatMap(label => 
        Array(options.copies).fill(null).map(() => this.generateSingleLabelHTML(label, options))
      ).join('\n');

      const completeHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Thermal Labels</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.12.1/dist/JsBarcode.all.min.js"></script>
            <style>
              @page { margin: 0; size: auto; }
              body { margin: 8px; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
              .label-container { display: flex; flex-wrap: wrap; gap: 8px; }
              .thermal-label {
                width: 227px; height: 189px; border: 2px solid #000; border-radius: 4px;
                padding: 3px; margin: 8px; font-size: 8px; background: white;
                display: flex; flex-direction: column; text-align: center; line-height: 1.1;
                box-sizing: border-box; overflow: hidden; page-break-inside: avoid; gap: 1px;
              }
            </style>
          </head>
          <body>
            <div class="label-container">${labelsHTML}</div>
            <script>
              // Generate barcodes after page loads - exactly like preview
              window.addEventListener('load', function() {
                const canvases = document.querySelectorAll('.barcode-canvas');
                canvases.forEach(canvas => {
                  const barcode = canvas.getAttribute('data-barcode');
                  if (barcode && window.JsBarcode) {
                    try {
                      JsBarcode(canvas, barcode, {
                        format: 'CODE128',
                        width: 1.8,
                        height: 35,
                        displayValue: true,
                        fontSize: 10,
                        fontOptions: 'bold',
                        font: 'Arial',
                        textAlign: 'center',
                        textPosition: 'bottom',
                        textMargin: 4,
                        margin: 5,
                        background: '#ffffff',
                        lineColor: '#000000',
                        marginTop: 2,
                        marginBottom: 2,
                        marginLeft: 10,
                        marginRight: 10
                      });
                    } catch (error) {
                      console.error('Barcode generation failed:', error);
                    }
                  }
                });
              });
            </script>
          </body>
        </html>
      `;

      // Use direct printing (most reliable for thermal labels)
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
        throw new Error('Print popup blocked. Please allow popups.');
      }

      printWindow.document.write(completeHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content and barcodes to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 2000); // Increased delay to ensure barcodes render

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

  /**
   * Generate HTML for a single label that matches the preview exactly
   */
  private static generateSingleLabelHTML(
    label: ThermalLabelData,
    options: ThermalLabelOptions & { companyName?: string }
  ): string {
    return `
      <div class="thermal-label">
        <!-- Header Section -->
        <div style="min-height: 16px; border-bottom: 1px solid #e5e5e5; padding-bottom: 1px; margin-bottom: 2px; overflow: hidden;">
          ${options.companyName ? `
            <div style="font-size: 8px; font-weight: 700; text-transform: uppercase; color: #000; letter-spacing: 0.5px; line-height: 1.0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${this.escapeHtml(options.companyName)}
            </div>
          ` : ''}
        </div>

        <!-- Main Content Section -->
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px; min-height: 0; overflow: hidden;">
          <!-- Product Name with Storage/RAM -->
          <div style="font-size: 16px; font-weight: 800; line-height: 1.0; color: #000; text-transform: uppercase; letter-spacing: 0.2px; max-height: 50px; overflow: hidden; text-align: center;">
            ${this.escapeHtml(label.productName)}
            ${(label.storage || label.ram) ? `
              <div style="font-size: 14px; font-weight: 600; margin-top: 1px; color: #333;">
                ${label.storage || ''}${label.storage && label.ram ? ' • ' : ''}${label.ram || ''}
              </div>
            ` : ''}
          </div>
          
          <!-- Serial Number Section -->
          ${label.serialNumber ? `
            <div style="font-size: 10px; font-weight: 600; color: #000; text-align: center; margin-top: 2px; letter-spacing: 0.1px;">
              ${this.escapeHtml(label.serialNumber)}
            </div>
          ` : ''}
        </div>

        <!-- Price Section -->
        ${label.maxPrice ? `
          <div style="font-size: 24px; font-weight: 900; color: #000; text-align: center; padding: 2px 0; border-top: 2px solid #000; margin-bottom: 2px; letter-spacing: 0.3px; line-height: 1.0;">
            €${label.maxPrice.toFixed(2)}
          </div>
        ` : ''}

        <!-- Barcode Section -->
        ${label.barcode ? `
          <div style="display: flex; justify-content: center; align-items: center; min-height: 55px; max-height: 55px; background: #ffffff; padding: 2px; overflow: hidden;">
            <canvas class="barcode-canvas" data-barcode="${this.escapeHtml(label.barcode)}" style="max-width: 200px; height: 50px;"></canvas>
          </div>
        ` : ''}
      </div>
    `;
  }
}