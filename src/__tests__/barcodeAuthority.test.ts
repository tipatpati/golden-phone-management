import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BarcodeAuthorityService } from '@/services/core/BarcodeAuthorityService';
import { BarcodeService } from '@/services/shared/BarcodeService';

// Mock the BarcodeService dependency
vi.mock('@/services/shared/BarcodeService', () => ({
  BarcodeService: vi.fn().mockImplementation(() => ({
    generateUnitBarcode: vi.fn(),
    generateProductBarcode: vi.fn(),
    validateBarcode: vi.fn(),
    getBarcodeByEntity: vi.fn(),
    validateUniqueness: vi.fn(),
    getBarcodeHistory: vi.fn(),
    registerBarcode: vi.fn(),
    updateConfig: vi.fn(),
    healthCheck: vi.fn(),
    parseBarcode: vi.fn()
  }))
}));

describe('BarcodeAuthorityService', () => {
  let authority: BarcodeAuthorityService;
  let mockBarcodeService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    
    // Create authority instance
    authority = new BarcodeAuthorityService({
      enableValidation: true,
      enableTracing: true,
      fallbackEnabled: false,
      maxRetries: 3
    });

    // Get the mock service instance
    mockBarcodeService = (authority as any).delegateService;
  });

  describe('Unit Barcode Generation', () => {
    it('should generate unit barcode with traceability', async () => {
      const unitId = 'unit-123';
      const expectedBarcode = 'GPMSU123456';
      
      // Mock existing barcode check (not found)
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue(null);
      
      // Mock barcode generation
      mockBarcodeService.generateUnitBarcode.mockResolvedValue(expectedBarcode);
      
      // Mock validation
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: true,
        format: 'CODE128',
        errors: []
      });

      const result = await authority.generateUnitBarcode(unitId);

      expect(result).toBe(expectedBarcode);
      expect(mockBarcodeService.getBarcodeByEntity).toHaveBeenCalledWith('product_unit', unitId);
      expect(mockBarcodeService.generateUnitBarcode).toHaveBeenCalledWith(unitId, undefined);
      
      // Verify barcode contract was created
      const contract = authority.getBarcodeContract(expectedBarcode);
      expect(contract).toBeTruthy();
      expect(contract?.barcode).toBe(expectedBarcode);
      expect(contract?.source).toBe('generated');
      expect(contract?.entityType).toBe('product_unit');
      expect(contract?.entityId).toBe(unitId);
    });

    it('should return existing barcode when found', async () => {
      const unitId = 'unit-456';
      const existingBarcode = 'GPMSU789012';
      
      // Mock existing barcode found
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue({
        id: '1',
        barcode: existingBarcode,
        barcode_type: 'unit',
        entity_type: 'product_unit',
        entity_id: unitId,
        format: 'CODE128',
        metadata: {},
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      });
      
      // Mock validation
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: true,
        format: 'CODE128',
        errors: []
      });

      const result = await authority.generateUnitBarcode(unitId);

      expect(result).toBe(existingBarcode);
      expect(mockBarcodeService.generateUnitBarcode).not.toHaveBeenCalled();
      
      // Verify barcode contract shows existing source
      const contract = authority.getBarcodeContract(existingBarcode);
      expect(contract?.source).toBe('existing');
    });

    it('should throw error for invalid generated barcode', async () => {
      const unitId = 'unit-invalid';
      const invalidBarcode = 'INVALID';
      
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue(null);
      mockBarcodeService.generateUnitBarcode.mockResolvedValue(invalidBarcode);
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: false,
        format: 'INVALID',
        errors: ['Invalid format']
      });

      await expect(authority.generateUnitBarcode(unitId)).rejects.toThrow(
        'Generated invalid barcode INVALID: Invalid format'
      );
    });
  });

  describe('Product Barcode Generation', () => {
    it('should generate product barcode with traceability', async () => {
      const productId = 'product-123';
      const expectedBarcode = 'GPMSP123456';
      
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue(null);
      mockBarcodeService.generateProductBarcode.mockResolvedValue(expectedBarcode);
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: true,
        format: 'CODE128',
        errors: []
      });

      const result = await authority.generateProductBarcode(productId);

      expect(result).toBe(expectedBarcode);
      expect(mockBarcodeService.getBarcodeByEntity).toHaveBeenCalledWith('product', productId);
      expect(mockBarcodeService.generateProductBarcode).toHaveBeenCalledWith(productId, undefined);
      
      const contract = authority.getBarcodeContract(expectedBarcode);
      expect(contract?.entityType).toBe('product');
      expect(contract?.source).toBe('generated');
    });
  });

  describe('Barcode Validation and Integrity', () => {
    it('should validate barcode format', () => {
      const barcode = 'GPMSU123456';
      const mockValidation = {
        isValid: true,
        format: 'CODE128',
        errors: []
      };
      
      mockBarcodeService.validateBarcode.mockReturnValue(mockValidation);

      const result = authority.validateBarcode(barcode);

      expect(result).toEqual(mockValidation);
      expect(mockBarcodeService.validateBarcode).toHaveBeenCalledWith(barcode);
    });

    it('should verify barcode integrity with contract', () => {
      const barcode = 'GPMSU123456';
      
      // First create a contract by generating a barcode
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue(null);
      mockBarcodeService.generateUnitBarcode.mockResolvedValue(barcode);
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: true,
        format: 'CODE128',
        errors: []
      });

      // Generate barcode to create contract
      return authority.generateUnitBarcode('unit-123').then(() => {
        // Now verify integrity
        const isValid = authority.verifyBarcodeIntegrity(barcode, 'generated');
        expect(isValid).toBe(true);
      });
    });

    it('should fail integrity check for invalid barcode', () => {
      const barcode = 'INVALID';
      
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: false,
        format: 'INVALID',
        errors: ['Invalid format']
      });

      const isValid = authority.verifyBarcodeIntegrity(barcode);
      expect(isValid).toBe(false);
    });

    it('should warn about source mismatch', () => {
      const barcode = 'GPMSU123456';
      
      // Create contract with 'generated' source
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue(null);
      mockBarcodeService.generateUnitBarcode.mockResolvedValue(barcode);
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: true,
        format: 'CODE128',
        errors: []
      });

      return authority.generateUnitBarcode('unit-123').then(() => {
        // Verify with wrong expected source
        const isValid = authority.verifyBarcodeIntegrity(barcode, 'existing');
        expect(isValid).toBe(true); // Still valid, but should warn
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('Source mismatch')
        );
      });
    });
  });

  describe('Barcode Tracing', () => {
    it('should provide trace statistics', async () => {
      const barcode1 = 'GPMSU123456';
      const barcode2 = 'GPMSP789012';
      
      // Mock services
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue(null);
      mockBarcodeService.generateUnitBarcode.mockResolvedValue(barcode1);
      mockBarcodeService.generateProductBarcode.mockResolvedValue(barcode2);
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: true,
        format: 'CODE128',
        errors: []
      });

      // Generate both barcodes
      await authority.generateUnitBarcode('unit-123');
      await authority.generateProductBarcode('product-456');

      const stats = authority.getTraceStats();
      expect(stats.totalContracts).toBe(2);
      expect(stats.sourceBreakdown.generated).toBe(2);
    });

    it('should clear trace data', async () => {
      const barcode = 'GPMSU123456';
      
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue(null);
      mockBarcodeService.generateUnitBarcode.mockResolvedValue(barcode);
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: true,
        format: 'CODE128',
        errors: []
      });

      await authority.generateUnitBarcode('unit-123');
      expect(authority.getTraceStats().totalContracts).toBe(1);

      authority.clearTrace();
      expect(authority.getTraceStats().totalContracts).toBe(0);
    });
  });

  describe('Health Check', () => {
    it('should include authority status in health check', async () => {
      const mockHealth = {
        status: 'healthy' as const,
        details: { database: 'Connected' }
      };
      
      mockBarcodeService.healthCheck.mockResolvedValue(mockHealth);

      const result = await authority.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.details.authority).toBe('active');
      expect(result.details.traceCount).toBeDefined();
      expect(result.details.config).toBeDefined();
    });
  });

  describe('Bulk Operations', () => {
    it('should handle bulk barcode generation', async () => {
      const requests = [
        { entityId: 'unit-1', type: 'unit' as const },
        { entityId: 'product-1', type: 'product' as const }
      ];
      
      mockBarcodeService.getBarcodeByEntity.mockResolvedValue(null);
      mockBarcodeService.generateUnitBarcode.mockResolvedValue('GPMSU123456');
      mockBarcodeService.generateProductBarcode.mockResolvedValue('GPMSP789012');
      mockBarcodeService.validateBarcode.mockReturnValue({
        isValid: true,
        format: 'CODE128',
        errors: []
      });

      const results = await authority.generateBulkBarcodes(requests);

      expect(results['unit-1']).toBe('GPMSU123456');
      expect(results['product-1']).toBe('GPMSP789012');
      expect(Object.keys(results)).toHaveLength(2);
    });
  });
});