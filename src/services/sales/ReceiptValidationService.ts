import type { Sale } from './types';

export interface ReceiptCalculations {
  originalSubtotal: number;
  subtotalWithoutVAT: number;
  discountAmount: number;
  finalSubtotal: number;
  vatAmount: number;
  finalTotal: number;
  itemsTotal: number;
  isValid: boolean;
  errors: string[];
}

/**
 * Service to validate receipt calculations and ensure all data is correct
 */
export class ReceiptValidationService {
  /**
   * Validates and calculates all receipt totals
   */
  static validateReceiptCalculations(sale: Sale): ReceiptCalculations {
    const errors: string[] = [];
    
    // Validate sale_items exist
    if (!sale.sale_items || sale.sale_items.length === 0) {
      errors.push('No sale items found');
      return {
        originalSubtotal: 0,
        subtotalWithoutVAT: 0,
        discountAmount: 0,
        finalSubtotal: 0,
        vatAmount: 0,
        finalTotal: 0,
        itemsTotal: 0,
        isValid: false,
        errors
      };
    }

    // Calculate item totals
    const itemsTotal = sale.sale_items.reduce((sum, item) => {
      if (!item.quantity || !item.unit_price) {
        errors.push(`Item missing quantity or price: ${item.product?.brand} ${item.product?.model}`);
        return sum;
      }
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const vatIncluded = sale.vat_included !== false; // default to true for backward compatibility
    const originalSubtotal = itemsTotal;
    const discountAmount = Number(sale.discount_amount) || 0;
    const discountPercentage = Number(sale.discount_percentage) || 0;
    const storedTotal = Number(sale.total_amount) || 0;
    
    let subtotalWithoutVAT: number;
    let vatAmount: number;
    let finalSubtotal: number;
    let finalTotal: number;
    
    if (vatIncluded) {
      // Prices include 22% VAT - extract base price first
      subtotalWithoutVAT = itemsTotal / 1.22; // Remove 22% VAT to get base price
      
      // Apply discount based on type (matching SaleCreationContext.tsx logic)
      if (discountPercentage > 0) {
        // PERCENTAGE DISCOUNT: Apply to subtotal (before VAT)
        const discountOnSubtotal = subtotalWithoutVAT * (discountPercentage / 100);
        finalSubtotal = subtotalWithoutVAT - discountOnSubtotal;
        vatAmount = finalSubtotal * 0.22; // 22% IVA on discounted subtotal
        finalTotal = finalSubtotal + vatAmount;
      } else if (discountAmount > 0) {
        // AMOUNT DISCOUNT: Apply to total (after VAT)
        const totalBeforeDiscount = subtotalWithoutVAT * 1.22; // Add VAT back
        finalTotal = totalBeforeDiscount - discountAmount;
        // Keep original subtotal and VAT, discount comes from total
        finalSubtotal = subtotalWithoutVAT;
        vatAmount = subtotalWithoutVAT * 0.22;
      } else {
        // No discount
        finalSubtotal = subtotalWithoutVAT;
        vatAmount = finalSubtotal * 0.22;
        finalTotal = finalSubtotal + vatAmount;
      }
    } else {
      // Prices are VAT-excluded - VAT was added during sale creation
      subtotalWithoutVAT = itemsTotal;
      
      // Apply discount based on type
      if (discountPercentage > 0) {
        // PERCENTAGE DISCOUNT: Apply to subtotal
        const discountOnSubtotal = subtotalWithoutVAT * (discountPercentage / 100);
        finalSubtotal = subtotalWithoutVAT - discountOnSubtotal;
        vatAmount = finalSubtotal * 0.22;
        finalTotal = finalSubtotal + vatAmount;
      } else if (discountAmount > 0) {
        // AMOUNT DISCOUNT: Apply to total (after VAT)
        const totalBeforeDiscount = subtotalWithoutVAT * 1.22;
        finalTotal = totalBeforeDiscount - discountAmount;
        finalSubtotal = subtotalWithoutVAT;
        vatAmount = subtotalWithoutVAT * 0.22;
      } else {
        // No discount
        finalSubtotal = subtotalWithoutVAT;
        vatAmount = finalSubtotal * 0.22;
        finalTotal = finalSubtotal + vatAmount;
      }
    }

    // Validation checks - use consistent total validation
    if (!this.validateTotalConsistency(finalTotal, storedTotal)) {
      errors.push(`Total mismatch: calculated ${finalTotal.toFixed(2)}, stored ${storedTotal.toFixed(2)}`);
    }

    if (discountAmount > subtotalWithoutVAT) {
      errors.push('Discount amount exceeds subtotal');
    }

    if (finalSubtotal < 0) {
      errors.push('Final subtotal cannot be negative');
    }

    // Validate payment methods sum to total
    const paymentSum = this.calculatePaymentSum(sale);
    if (Math.abs(paymentSum - finalTotal) > 0.01 && paymentSum > 0) {
      errors.push(`Payment sum mismatch: payments ${paymentSum.toFixed(2)}, total ${finalTotal.toFixed(2)}`);
    }

    return {
      originalSubtotal,
      subtotalWithoutVAT,
      discountAmount,
      finalSubtotal,
      vatAmount,
      finalTotal,
      itemsTotal,
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate VAT amount from stored total for VAT-excluded sales
   */
  private static calculateVATFromTotal(storedTotal: number, finalSubtotal: number): number {
    // For VAT-excluded sales, the stored total includes VAT that was added during creation
    // VAT = storedTotal - finalSubtotal (where finalSubtotal is base price after discount)
    return Math.max(0, storedTotal - finalSubtotal);
  }

  /**
   * Validate that receipt calculations match stored sale totals
   */
  private static validateTotalConsistency(calculatedTotal: number, storedTotal: number): boolean {
    return Math.abs(calculatedTotal - storedTotal) <= 0.01;
  }

  /**
   * Calculate total from payment methods
   */
  private static calculatePaymentSum(sale: Sale): number {
    const cash = Number(sale.cash_amount) || 0;
    const card = Number(sale.card_amount) || 0;
    const bank = Number(sale.bank_transfer_amount) || 0;
    
    // If no split payments, use total amount
    if (cash === 0 && card === 0 && bank === 0) {
      return Number(sale.total_amount) || 0;
    }
    
    return cash + card + bank;
  }

  /**
   * Validates all sale items have required product information
   */
  static validateSaleItems(sale: Sale): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!sale.sale_items || sale.sale_items.length === 0) {
      errors.push('No sale items found');
      return { isValid: false, errors };
    }

    sale.sale_items.forEach((item, index) => {
      if (!item.product_id) {
        errors.push(`Item ${index + 1}: Missing product ID`);
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Invalid quantity`);
      }
      
      if (!item.unit_price || item.unit_price <= 0) {
        errors.push(`Item ${index + 1}: Invalid unit price`);
      }
      
      if (!item.product) {
        errors.push(`Item ${index + 1}: Missing product information`);
      } else {
        if (!item.product.brand) {
          errors.push(`Item ${index + 1}: Missing product brand`);
        }
        if (!item.product.model) {
          errors.push(`Item ${index + 1}: Missing product model`);
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Generates a complete receipt validation report
   */
  static generateReceiptReport(sale: Sale): {
    calculations: ReceiptCalculations;
    itemsValidation: { isValid: boolean; errors: string[] };
    overallValid: boolean;
    summary: string;
  } {
    const calculations = this.validateReceiptCalculations(sale);
    const itemsValidation = this.validateSaleItems(sale);
    
    const overallValid = calculations.isValid && itemsValidation.isValid;
    
    let summary = `Receipt for sale ${sale.sale_number}: `;
    if (overallValid) {
      summary += `Valid - ${sale.sale_items?.length || 0} items, Total: €${calculations.finalTotal.toFixed(2)}`;
    } else {
      const totalErrors = calculations.errors.length + itemsValidation.errors.length;
      summary += `Invalid - ${totalErrors} error(s) found`;
    }
    
    return {
      calculations,
      itemsValidation,
      overallValid,
      summary
    };
  }
}