import { ThermalLabelData, ThermalLabelOptions } from "../types";

export function validateLabelData(labels: ThermalLabelData[]): void {
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

export function validateOptions(options: ThermalLabelOptions): void {
  if (!options.copies || options.copies < 1 || options.copies > 50) {
    throw new Error('Copies must be between 1 and 50');
  }
  if (!['standard', 'compact'].includes(options.format)) {
    throw new Error('Format must be either "standard" or "compact"');
  }
}
