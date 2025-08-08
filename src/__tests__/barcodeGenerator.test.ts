import { describe, it, expect } from 'vitest';
import { validateEAN13Barcode, generateValidEAN13Barcode, generateSKUBasedBarcode } from '@/utils/barcodeGenerator';

describe('barcodeGenerator utilities', () => {
  it('generates a valid EAN13 from a 12-digit prefix', () => {
    const barcode = generateValidEAN13Barcode('123456789012');
    expect(barcode).toMatch(/^\d{13}$/);
    expect(validateEAN13Barcode(barcode)).toBe(true);
  });

  it('validates known invalid EAN13', () => {
    const invalid = '1234567890123'; // likely invalid
    expect(validateEAN13Barcode(invalid)).toBe(false);
  });

  it('generates a SKU-based barcode string for arbitrary serials', () => {
    const output = generateSKUBasedBarcode('ABC123', 'PROD1', 85);
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });
});
