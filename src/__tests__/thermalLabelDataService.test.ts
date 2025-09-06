import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThermalLabelDataService } from '@/services/labels/ThermalLabelDataService';
import { ProductUnitsService } from '@/services/products/ProductUnitsService';
import { ProductForLabels } from '@/services/labels/types';

// Mock the dependencies
vi.mock('@/services/products/ProductUnitsService', () => ({
  ProductUnitsService: {
    getUnitsForProduct: vi.fn()
  }
}));

vi.mock('@/utils/productNaming', () => ({
  formatProductName: vi.fn((args) => `${args.brand} ${args.model}`),
  formatProductUnitName: vi.fn((args) => `${args.brand} ${args.model} ${args.storage}GB`)
}));

describe('ThermalLabelDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  const mockProduct: ProductForLabels = {
    id: 'product-1',
    brand: 'Apple',
    model: 'iPhone 14',
    price: 800,
    max_price: 900,
    serial_numbers: ['ABC123', 'DEF456'],
    category: { name: 'Smartphones' },
    storage: 128,
    ram: 6
  };

  const mockUnits = [
    {
      id: 'unit-1',
      product_id: 'product-1',
      serial_number: 'ABC123',
      barcode: 'GPMS123456',
      price: 850,
      storage: 256,
      ram: 8,
      color: 'Blue',
      battery_level: 85,
      status: 'available' as const,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    {
      id: 'unit-2',
      product_id: 'product-1',
      serial_number: 'DEF456',
      barcode: 'GPMS789012',
      price: 800,
      storage: 128,
      ram: 6,
      color: 'Red',
      battery_level: 90,
      status: 'available' as const,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    }
  ];

  it('should generate labels for products with units successfully', async () => {
    // Mock the service to return units
    vi.mocked(ProductUnitsService.getUnitsForProduct).mockResolvedValue(mockUnits);

    const result = await ThermalLabelDataService.generateLabelsForProducts([mockProduct]);

    expect(result.success).toBe(true);
    expect(result.labels).toHaveLength(2);
    expect(result.stats.totalLabels).toBe(2);
    expect(result.stats.unitsWithBarcodes).toBe(2);
    expect(result.stats.unitsMissingBarcodes).toBe(0);

    // Check first label
    const firstLabel = result.labels[0];
    expect(firstLabel.serialNumber).toBe('ABC123');
    expect(firstLabel.barcode).toBe('GPMS123456');
    expect(firstLabel.storage).toBe(256);
    expect(firstLabel.ram).toBe(8);
    expect(firstLabel.price).toBe(850);
  });

  it('should handle units missing barcodes', async () => {
    const unitsWithoutBarcodes = [
      { ...mockUnits[0], barcode: undefined },
      mockUnits[1]
    ];

    vi.mocked(ProductUnitsService.getUnitsForProduct).mockResolvedValue(unitsWithoutBarcodes);

    const result = await ThermalLabelDataService.generateLabelsForProducts([mockProduct]);

    expect(result.success).toBe(false);
    expect(result.labels).toHaveLength(1); // Only one unit has barcode
    expect(result.stats.unitsWithBarcodes).toBe(1);
    expect(result.stats.unitsMissingBarcodes).toBe(1);
    expect(result.errors).toContain('Unit ABC123 missing required barcode - use Barcode Backfill Tool');
  });

  it('should generate generic labels for products without serial numbers', async () => {
    const bulkProduct: ProductForLabels = {
      ...mockProduct,
      serial_numbers: undefined,
      stock: 3,
      barcode: 'BULK123'
    };

    const result = await ThermalLabelDataService.generateLabelsForProducts([bulkProduct]);

    expect(result.success).toBe(true);
    expect(result.labels).toHaveLength(3);
    expect(result.stats.genericLabels).toBe(3);
    expect(result.stats.unitsWithBarcodes).toBe(0);

    // Check generic label
    const firstLabel = result.labels[0];
    expect(firstLabel.serialNumber).toBeUndefined();
    expect(firstLabel.barcode).toBe('BULK123');
    expect(firstLabel.storage).toBe(128);
    expect(firstLabel.ram).toBe(6);
  });

  it('should fall back to defaults for missing storage/RAM data', async () => {
    const unitWithoutSpecs = {
      ...mockUnits[0],
      storage: undefined,
      ram: undefined
    };

    vi.mocked(ProductUnitsService.getUnitsForProduct).mockResolvedValue([unitWithoutSpecs]);

    const result = await ThermalLabelDataService.generateLabelsForProducts([mockProduct]);

    expect(result.success).toBe(true);
    const label = result.labels[0];
    expect(label.storage).toBe(128); // Product default
    expect(label.ram).toBe(6); // Product default
  });

  it('should handle service errors gracefully', async () => {
    vi.mocked(ProductUnitsService.getUnitsForProduct).mockRejectedValue(new Error('Database error'));

    const result = await ThermalLabelDataService.generateLabelsForProducts([mockProduct]);

    expect(result.success).toBe(false);
    expect(result.labels).toHaveLength(0);
    expect(result.errors).toContain('Failed to fetch units for product product-1: Error: Database error');
  });
});