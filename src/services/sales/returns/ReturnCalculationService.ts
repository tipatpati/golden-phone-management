import type { ReturnCondition, ReturnCalculation } from './types';
import type { Sale } from '../types';

export class ReturnCalculationService {
  /**
   * Calculate restocking fee based on return condition
   * - new: 0-5% fee depending on time
   * - good: 10% fee
   * - damaged: 30% fee
   * - defective: 0% fee (warranty)
   */
  static calculateRestockingFee(
    originalPrice: number,
    condition: ReturnCondition,
    daysSincePurchase: number
  ): number {
    // No fee for defective items (warranty)
    if (condition === 'defective') return 0;
    
    // No fee within 14 days for items in new condition
    if (condition === 'new' && daysSincePurchase <= 14) return 0;
    
    // Progressive fees based on condition
    const feePercentages: Record<ReturnCondition, number> = {
      new: 0.05,      // 5% after 14 days
      good: 0.10,     // 10%
      damaged: 0.30,  // 30%
      defective: 0    // 0%
    };
    
    return originalPrice * feePercentages[condition];
  }
  
  /**
   * Calculate full return including all items
   */
  static calculateReturn(
    saleDate: string,
    items: Array<{
      sale_item_id: string;
      unit_price: number;
      quantity: number;
      return_condition: ReturnCondition;
    }>
  ): ReturnCalculation {
    const daysSincePurchase = Math.floor(
      (Date.now() - new Date(saleDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const breakdown = items.map(item => {
      const itemTotal = item.unit_price * item.quantity;
      const itemFee = this.calculateRestockingFee(
        itemTotal,
        item.return_condition,
        daysSincePurchase
      );
      
      return {
        itemId: item.sale_item_id,
        itemOriginalPrice: itemTotal,
        itemRestockingFee: itemFee,
        itemRefundAmount: itemTotal - itemFee
      };
    });
    
    const originalAmount = breakdown.reduce((sum, b) => sum + b.itemOriginalPrice, 0);
    const restockingFee = breakdown.reduce((sum, b) => sum + b.itemRestockingFee, 0);
    const refundAmount = originalAmount - restockingFee;
    
    return { originalAmount, restockingFee, refundAmount, breakdown };
  }
  
  /**
   * Validate return eligibility
   */
  static validateReturn(
    sale: Sale,
    itemsToReturn: Array<{ sale_item_id: string; quantity: number }>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if sale is already fully refunded
    if (sale.status === 'refunded') {
      errors.push('Questa vendita è già stata completamente rimborsata');
    }
    
    // Check if sale is cancelled
    if (sale.status === 'cancelled') {
      errors.push('Non è possibile restituire articoli da una vendita annullata');
    }
    
    // Check if items exist in sale
    const saleItemIds = new Set(sale.sale_items?.map(i => i.id) || []);
    for (const item of itemsToReturn) {
      if (!saleItemIds.has(item.sale_item_id)) {
        errors.push(`Articolo ${item.sale_item_id} non trovato nella vendita`);
      }
    }
    
    // Check quantities
    for (const item of itemsToReturn) {
      const saleItem = sale.sale_items?.find(i => i.id === item.sale_item_id);
      if (saleItem && item.quantity > saleItem.quantity) {
        const productName = saleItem.product ? `${saleItem.product.brand} ${saleItem.product.model}` : 'Prodotto';
        errors.push(`Non è possibile restituire più della quantità venduta per ${productName}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}
