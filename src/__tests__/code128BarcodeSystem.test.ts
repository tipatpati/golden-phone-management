import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Code128GeneratorService, BarcodeRegistryService } from '@/services/barcodes';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { setting_value: { prefix: 'GPMS', format: 'CODE128', counters: { unit: 1000, product: 1000 } } }, 
            error: null 
          }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { id: 'test-id', barcode: 'GPMSU001001', barcode_type: 'unit' }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

describe('Professional CODE128 Barcode System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Code128GeneratorService', () => {
    it('validates GPMS CODE128 format correctly', () => {
      const validBarcode = 'GPMSU001001';
      const validation = Code128GeneratorService.validateCode128(validBarcode);
      
      expect(validation.isValid).toBe(true);
      expect(validation.format).toBe('CODE128');
      expect(validation.errors).toHaveLength(0);
    });

    it('rejects invalid barcode formats', () => {
      const invalidBarcodes = [
        '', // Empty
        'ABC', // Too short
        'INVALIDGPMSU001001TOOLONG', // Too long
        'WRONGU001001', // Wrong prefix
        'GPMSX001001', // Invalid type
        'GPMSU00100A', // Invalid counter
      ];

      invalidBarcodes.forEach(barcode => {
        const validation = Code128GeneratorService.validateCode128(barcode);
        expect(validation.isValid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
      });
    });

    it('parses barcode information correctly', () => {
      const barcode = 'GPMSU001234';
      const info = Code128GeneratorService.parseBarcodeInfo(barcode);
      
      expect(info.prefix).toBe('GPMS');
      expect(info.type).toBe('unit');
      expect(info.counter).toBe(1234);
      expect(info.isValid).toBe(true);
    });

    it('generates unique unit barcodes', async () => {
      const unitId = 'test-unit-id';
      const barcode = await Code128GeneratorService.generateUnitBarcode(unitId);
      
      expect(barcode).toMatch(/^GPMSU\d{6}$/);
      expect(barcode.startsWith('GPMSU')).toBe(true);
    });

    it('handles existing barcode retrieval', async () => {
      const unitId = 'existing-unit-id';
      const barcode = await Code128GeneratorService.getOrGenerateUnitBarcode(unitId);
      
      expect(typeof barcode).toBe('string');
      expect(barcode.length).toBeGreaterThan(0);
    });
  });

  describe('BarcodeRegistryService', () => {
    it('validates barcode uniqueness', async () => {
      const testBarcode = 'GPMSU999999';
      const isUnique = await BarcodeRegistryService.validateBarcodeUniqueness(testBarcode);
      
      expect(typeof isUnique).toBe('boolean');
    });

    it('registers new barcodes', async () => {
      const barcode = 'GPMSU001001';
      const result = await BarcodeRegistryService.registerBarcode(
        barcode,
        'unit',
        'product_unit',
        'test-unit-id'
      );
      
      expect(result).toBeDefined();
      expect(result.barcode).toBe(barcode);
      expect(result.barcode_type).toBe('unit');
    });

    it('generates unique sequential barcodes', async () => {
      const barcode1 = await BarcodeRegistryService.generateUniqueBarcode('product_unit', 'unit1', 'unit');
      const barcode2 = await BarcodeRegistryService.generateUniqueBarcode('product_unit', 'unit2', 'unit');
      
      expect(barcode1).not.toBe(barcode2);
      expect(barcode1).toMatch(/^GPMSU\d{6}$/);
      expect(barcode2).toMatch(/^GPMSU\d{6}$/);
    });
  });

  describe('Barcode Format Consistency', () => {
    it('ensures all unit barcodes follow GPMSU format', async () => {
      const barcodes = await Promise.all([
        Code128GeneratorService.generateUnitBarcode('unit1'),
        Code128GeneratorService.generateUnitBarcode('unit2'),
        Code128GeneratorService.generateUnitBarcode('unit3')
      ]);

      barcodes.forEach(barcode => {
        expect(barcode).toMatch(/^GPMSU\d{6}$/);
        const validation = Code128GeneratorService.validateCode128(barcode);
        expect(validation.isValid).toBe(true);
      });
    });

    it('ensures deterministic generation for same inputs', async () => {
      // Note: This test assumes the service has some way to handle deterministic generation
      // In practice, the registry prevents duplicates, so this tests the overall system
      const unitId = 'deterministic-test-unit';
      
      const barcode1 = await Code128GeneratorService.getOrGenerateUnitBarcode(unitId);
      const barcode2 = await Code128GeneratorService.getOrGenerateUnitBarcode(unitId);
      
      // Should return the same barcode for the same unit
      expect(barcode1).toBe(barcode2);
    });
  });

  describe('Integration Tests', () => {
    it('handles bulk barcode generation', async () => {
      const unitIds = ['unit1', 'unit2', 'unit3', 'unit4', 'unit5'];
      const results = await Code128GeneratorService.generateBulkUnitBarcodes(unitIds);
      
      expect(Object.keys(results)).toHaveLength(unitIds.length);
      
      // Check all barcodes are unique
      const barcodes = Object.values(results);
      const uniqueBarcodes = new Set(barcodes);
      expect(uniqueBarcodes.size).toBe(barcodes.length);
      
      // Check all follow correct format
      barcodes.forEach(barcode => {
        expect(barcode).toMatch(/^GPMSU\d{6}$/);
      });
    });

    it('validates entire barcode system workflow', async () => {
      // 1. Generate barcode
      const unitId = 'workflow-test-unit';
      const barcode = await Code128GeneratorService.generateUnitBarcode(unitId);
      
      // 2. Validate format
      const validation = Code128GeneratorService.validateCode128(barcode);
      expect(validation.isValid).toBe(true);
      
      // 3. Parse information
      const info = Code128GeneratorService.parseBarcodeInfo(barcode);
      expect(info.prefix).toBe('GPMS');
      expect(info.type).toBe('unit');
      expect(info.isValid).toBe(true);
      
      // 4. Check registry
      const isUnique = await BarcodeRegistryService.validateBarcodeUniqueness(barcode);
      // Should be false since we just registered it
      expect(isUnique).toBe(false);
    });
  });
});