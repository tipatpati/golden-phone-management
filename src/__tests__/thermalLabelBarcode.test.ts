import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useThermalLabels } from '@/components/inventory/labels/hooks/useThermalLabels';
import { ProductUnitsService } from '@/services/products/ProductUnitsService';

// Mock the ProductUnitsService
vi.mock('@/services/products/ProductUnitsService', () => ({
  ProductUnitsService: {
    getUnitsForProduct: vi.fn()
  }
}));

// Mock barcode generator
vi.mock('@/utils/barcodeGenerator', () => ({
  generateSKUBasedBarcode: vi.fn((serial: string, productId: string) => `SKU-${serial}-${productId.slice(0, 8)}`)
}));

// Mock product naming
vi.mock('@/utils/productNaming', () => ({
  formatProductName: vi.fn(({ brand, model }) => `${brand} ${model}`),
  formatProductUnitName: vi.fn(({ brand, model, storage, color }) => 
    `${brand} ${model} ${storage}GB${color ? ` ${color}` : ''}`
  )
}));

// Mock serial number utils
vi.mock('@/utils/serialNumberUtils', () => ({
  parseSerialWithBattery: vi.fn((serial: string) => ({
    serial: serial.replace(/\s*\(.*?\)\s*/g, ''),
    color: serial.includes('(') ? serial.match(/\((.*?)\)/)?.[1] : undefined,
    batteryLevel: serial.includes('%') ? parseInt(serial.match(/(\d+)%/)?.[1] || '0') : undefined
  }))
}));

describe('Thermal Label Barcode Uniqueness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProduct = {
    id: 'prod-123',
    brand: 'iPhone',
    model: '14 Pro',
    price: 999,
    barcode: 'MASTER-BARCODE-123',
    serial_numbers: ['IMEI123456789', 'IMEI987654321']
  };

  const mockUnits = [
    {
      id: 'unit-1',
      product_id: 'prod-123',
      serial_number: 'IMEI123456789',
      barcode: 'UNIT-BARCODE-001',
      storage: 256,
      ram: 8,
      color: 'Blue'
    },
    {
      id: 'unit-2', 
      product_id: 'prod-123',
      serial_number: 'IMEI987654321',
      barcode: 'UNIT-BARCODE-002',
      storage: 512,
      ram: 8,
      color: 'Red'
    }
  ];

  it('should use unique unit barcodes by default', async () => {
    (ProductUnitsService.getUnitsForProduct as any).mockResolvedValue(mockUnits);

    const { result, rerender } = renderHook(
      ({ products, useMasterBarcode }) => useThermalLabels(products, useMasterBarcode),
      { 
        initialProps: { 
          products: [mockProduct], 
          useMasterBarcode: false 
        } 
      }
    );

    // Wait for async unit fetching
    await vi.waitFor(() => {
      rerender({ products: [mockProduct], useMasterBarcode: false });
    });

    const labels = result.current;
    
    expect(labels).toHaveLength(2);
    expect(labels[0].barcode).toBe('UNIT-BARCODE-001');
    expect(labels[1].barcode).toBe('UNIT-BARCODE-002');
    
    // Verify barcodes are unique
    const barcodes = labels.map(l => l.barcode);
    expect(new Set(barcodes).size).toBe(barcodes.length);
  });

  it('should use master barcode when useMasterBarcode is true', async () => {
    (ProductUnitsService.getUnitsForProduct as any).mockResolvedValue(mockUnits);

    const { result, rerender } = renderHook(
      ({ products, useMasterBarcode }) => useThermalLabels(products, useMasterBarcode),
      { 
        initialProps: { 
          products: [mockProduct], 
          useMasterBarcode: true 
        } 
      }
    );

    // Wait for async unit fetching
    await vi.waitFor(() => {
      rerender({ products: [mockProduct], useMasterBarcode: true });
    });

    const labels = result.current;
    
    expect(labels).toHaveLength(2);
    expect(labels[0].barcode).toBe('MASTER-BARCODE-123');
    expect(labels[1].barcode).toBe('MASTER-BARCODE-123');
  });

  it('should generate unique barcodes when units have no barcode', async () => {
    const unitsWithoutBarcodes = mockUnits.map(unit => ({ ...unit, barcode: null }));
    (ProductUnitsService.getUnitsForProduct as any).mockResolvedValue(unitsWithoutBarcodes);

    const { result, rerender } = renderHook(
      ({ products, useMasterBarcode }) => useThermalLabels(products, useMasterBarcode),
      { 
        initialProps: { 
          products: [mockProduct], 
          useMasterBarcode: false 
        } 
      }
    );

    // Wait for async unit fetching
    await vi.waitFor(() => {
      rerender({ products: [mockProduct], useMasterBarcode: false });
    });

    const labels = result.current;
    
    expect(labels).toHaveLength(2);
    expect(labels[0].barcode).toBe('SKU-IMEI123456789-prod-123');
    expect(labels[1].barcode).toBe('SKU-IMEI987654321-prod-123');
    
    // Verify barcodes are unique
    const barcodes = labels.map(l => l.barcode);
    expect(new Set(barcodes).size).toBe(barcodes.length);
  });

  it('should handle products without master barcode', async () => {
    const productWithoutBarcode = { ...mockProduct, barcode: undefined };
    (ProductUnitsService.getUnitsForProduct as any).mockResolvedValue(mockUnits);

    const { result, rerender } = renderHook(
      ({ products, useMasterBarcode }) => useThermalLabels(products, useMasterBarcode),
      { 
        initialProps: { 
          products: [productWithoutBarcode], 
          useMasterBarcode: true 
        } 
      }
    );

    // Wait for async unit fetching
    await vi.waitFor(() => {
      rerender({ products: [productWithoutBarcode], useMasterBarcode: true });
    });

    const labels = result.current;
    
    expect(labels).toHaveLength(2);
    // Should fall back to unit barcodes even when useMasterBarcode is true
    expect(labels[0].barcode).toBe('UNIT-BARCODE-001');
    expect(labels[1].barcode).toBe('UNIT-BARCODE-002');
  });
});