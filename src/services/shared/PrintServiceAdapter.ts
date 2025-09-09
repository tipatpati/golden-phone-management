/**
 * Print Service Adapter
 * Wraps the ThermalLabelService to work with the new PrintService interface
 */

import { ThermalLabelService } from "@/components/inventory/labels/services/ThermalLabelService";
import { ThermalLabelData, ThermalLabelOptions } from "@/components/inventory/labels/types";

export interface IPrintServiceAdapter {
  generateLabelHTML(labels: ThermalLabelData[], options: ThermalLabelOptions): Promise<string>;
  printLabels(labels: ThermalLabelData[], options: ThermalLabelOptions): Promise<{
    success: boolean;
    message: string;
    totalLabels: number;
  }>;
}

export class PrintServiceAdapter implements IPrintServiceAdapter {
  async generateLabelHTML(labels: ThermalLabelData[], options: ThermalLabelOptions): Promise<string> {
    try {
      return ThermalLabelService.generateThermalLabels(labels, options);
    } catch (error) {
      console.error('Failed to generate label HTML:', error);
      throw error;
    }
  }

  async printLabels(labels: ThermalLabelData[], options: ThermalLabelOptions): Promise<{
    success: boolean;
    message: string;
    totalLabels: number;
  }> {
    try {
      return await ThermalLabelService.printLabels(labels, options);
    } catch (error) {
      console.error('Failed to print labels:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Print operation failed',
        totalLabels: 0
      };
    }
  }
}