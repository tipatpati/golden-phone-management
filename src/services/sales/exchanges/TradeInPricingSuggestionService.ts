import { supabase } from '@/integrations/supabase/client';
import { TradeInCondition } from './types';

export class TradeInPricingSuggestionService {
  /**
   * Get historical pricing for a brand/model combination
   */
  async getHistoricalPricing(brand: string, model: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('price, min_price, max_price')
        .ilike('brand', brand)
        .ilike('model', model)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) {
        return null;
      }

      // Calculate average price from available products
      const prices = data.map(p => p.price).filter(p => p > 0);
      if (prices.length === 0) return null;

      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      return avgPrice;
    } catch (error) {
      console.error('Error fetching historical pricing:', error);
      return null;
    }
  }

  /**
   * Calculate suggested trade-in value based on base price and condition
   */
  calculateSuggestedTradeInValue(basePrice: number, condition: TradeInCondition): number {
    if (basePrice <= 0) return 0;

    // Depreciation factors based on condition
    const depreciationFactors: Record<TradeInCondition, number> = {
      excellent: 0.70, // 70% of base price
      good: 0.55,      // 55% of base price
      fair: 0.40,      // 40% of base price
      poor: 0.25       // 25% of base price
    };

    const factor = depreciationFactors[condition] || 0.50;
    return Math.round(basePrice * factor);
  }

  /**
   * Get comprehensive pricing suggestion for a trade-in item
   */
  async getPricingSuggestion(
    brand: string, 
    model: string, 
    condition: TradeInCondition
  ): Promise<{
    historicalPrice: number | null;
    suggestedValue: number | null;
    hasHistoricalData: boolean;
  }> {
    const historicalPrice = await this.getHistoricalPricing(brand, model);
    
    if (!historicalPrice) {
      return {
        historicalPrice: null,
        suggestedValue: null,
        hasHistoricalData: false
      };
    }

    const suggestedValue = this.calculateSuggestedTradeInValue(historicalPrice, condition);

    return {
      historicalPrice,
      suggestedValue,
      hasHistoricalData: true
    };
  }

  /**
   * Get pricing from a specific product ID
   */
  async getPricingFromProduct(productId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('price')
        .eq('id', productId)
        .single();

      if (error || !data) return null;
      return data.price;
    } catch (error) {
      console.error('Error fetching product pricing:', error);
      return null;
    }
  }
}

export const tradeInPricingSuggestionService = new TradeInPricingSuggestionService();
