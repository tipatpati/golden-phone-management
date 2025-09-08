import { describe, it, expect } from 'vitest';
import { ReceiptValidationService } from '@/services/sales/ReceiptValidationService';
import type { Sale } from '@/services/sales/types';

describe('ReceiptValidationService', () => {
  const createMockSale = (saleItems: any[], saleData: Partial<Sale> = {}): Sale => ({
    id: '123',
    sale_number: 'TEST-001',
    sale_date: new Date().toISOString(),
    status: 'completed',
    salesperson_id: 'user-123',
    payment_method: 'cash',
    payment_type: 'single',
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    discount_amount: 0,
    discount_percentage: 0,
    cash_amount: 0,
    card_amount: 0,
    bank_transfer_amount: 0,
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sale_items: saleItems,
    ...saleData
  });

  const createMockSaleItem = (data: any = {}) => ({
    id: '1',
    sale_id: '123',
    product_id: 'prod-1',
    quantity: 1,
    unit_price: 122, // Price includes 22% VAT
    total_price: 122,
    serial_number: null,
    created_at: new Date().toISOString(),
    product: {
      id: 'prod-1',
      brand: 'iPhone',
      model: '13 Pro',
      year: 2021
    },
    ...data
  });

  describe('validateReceiptCalculations', () => {
    it('should calculate VAT correctly for single item', () => {
      const saleItem = createMockSaleItem();
      const sale = createMockSale([saleItem], { 
        total_amount: 122,
        subtotal: 100,
        tax_amount: 22
      });

      const result = ReceiptValidationService.validateReceiptCalculations(sale);

      expect(result.isValid).toBe(true);
      expect(result.originalSubtotal).toBe(122); // Price with VAT
      expect(result.subtotalWithoutVAT).toBeCloseTo(100, 2); // Base price
      expect(result.vatAmount).toBeCloseTo(22, 2); // 22% VAT
      expect(result.finalTotal).toBeCloseTo(122, 2); // Total
    });

    it('should handle multiple items correctly', () => {
      const saleItems = [
        createMockSaleItem({ 
          id: '1', 
          quantity: 2, 
          unit_price: 122, 
          total_price: 244,
          product: { id: 'prod-1', brand: 'iPhone', model: '13 Pro' }
        }),
        createMockSaleItem({ 
          id: '2', 
          quantity: 1, 
          unit_price: 61, 
          total_price: 61,
          product: { id: 'prod-2', brand: 'Samsung', model: 'Galaxy S21' }
        })
      ];
      
      const sale = createMockSale(saleItems, { 
        total_amount: 305,
        subtotal: 250,
        tax_amount: 55
      });

      const result = ReceiptValidationService.validateReceiptCalculations(sale);

      expect(result.isValid).toBe(true);
      expect(result.originalSubtotal).toBe(305); // 244 + 61
      expect(result.subtotalWithoutVAT).toBeCloseTo(250, 2); // Base price
      expect(result.itemsTotal).toBe(305);
    });

    it('should handle discounts correctly', () => {
      const saleItem = createMockSaleItem({ unit_price: 122, total_price: 122 });
      const sale = createMockSale([saleItem], { 
        total_amount: 110,
        discount_amount: 10,
        subtotal: 90,
        tax_amount: 20
      });

      const result = ReceiptValidationService.validateReceiptCalculations(sale);

      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(10);
      expect(result.finalSubtotal).toBeCloseTo(90, 2); // 100 - 10
      expect(result.vatAmount).toBeCloseTo(19.8, 2); // 22% of discounted amount
    });

    it('should detect calculation errors', () => {
      const saleItem = createMockSaleItem();
      const sale = createMockSale([saleItem], { 
        total_amount: 200 // Wrong total
      });

      const result = ReceiptValidationService.validateReceiptCalculations(sale);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Total mismatch'));
    });

    it('should validate no sale items', () => {
      const sale = createMockSale([], { total_amount: 0 });

      const result = ReceiptValidationService.validateReceiptCalculations(sale);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No sale items found');
    });
  });

  describe('validateSaleItems', () => {
    it('should validate complete sale items', () => {
      const saleItems = [createMockSaleItem()];
      const sale = createMockSale(saleItems);

      const result = ReceiptValidationService.validateSaleItems(sale);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing product information', () => {
      const saleItems = [createMockSaleItem({ 
        product: null 
      })];
      const sale = createMockSale(saleItems);

      const result = ReceiptValidationService.validateSaleItems(sale);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Item 1: Missing product information');
    });

    it('should detect invalid quantities and prices', () => {
      const saleItems = [createMockSaleItem({ 
        quantity: 0,
        unit_price: -10
      })];
      const sale = createMockSale(saleItems);

      const result = ReceiptValidationService.validateSaleItems(sale);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Item 1: Invalid quantity');
      expect(result.errors).toContain('Item 1: Invalid unit price');
    });
  });

  describe('generateReceiptReport', () => {
    it('should generate complete valid report', () => {
      const saleItem = createMockSaleItem();
      const sale = createMockSale([saleItem], { 
        total_amount: 122,
        sale_number: 'TEST-001'
      });

      const report = ReceiptValidationService.generateReceiptReport(sale);

      expect(report.overallValid).toBe(true);
      expect(report.summary).toContain('Valid - 1 items');
      expect(report.summary).toContain('€122.00');
      expect(report.calculations.isValid).toBe(true);
      expect(report.itemsValidation.isValid).toBe(true);
    });

    it('should generate invalid report with errors', () => {
      const saleItems = [createMockSaleItem({ product: null })];
      const sale = createMockSale(saleItems, { 
        total_amount: 200, // Wrong total
        sale_number: 'TEST-002'
      });

      const report = ReceiptValidationService.generateReceiptReport(sale);

      expect(report.overallValid).toBe(false);
      expect(report.summary).toContain('Invalid');
      expect(report.summary).toContain('error(s) found');
    });
  });
});