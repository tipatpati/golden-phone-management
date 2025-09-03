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