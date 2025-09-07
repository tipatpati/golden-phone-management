import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductUnit } from '@/services/inventory';

// Centralized stock calculation utilities
export class StockCalculationService {
  // Compute effective stock from a product object (with optional product_units)
  static effectiveFromProduct(product: Partial<Product> & { product_units?: Array<Partial<ProductUnit>> }): number {
    if (!product) return 0;
    if ((product as any).has_serial && Array.isArray((product as any).product_units)) {
      return ((product as any).product_units || []).filter((u: any) => u?.status === 'available').length;
    }
    return Number((product as any).stock) || 0;
  }

  // Compute effective stock from a list by id (used in components to avoid duplicate logic)
  static effectiveFromList(products: Array<any>, productId: string): number {
    if (!Array.isArray(products)) return 0;
    const product = products.find((p: any) => p?.id === productId);
    return this.effectiveFromProduct(product || {});
  }

  // Fetch effective stock from DB function when needed (server-authoritative)
  static async fetchEffectiveStock(productId: string): Promise<number> {
    if (!productId) return 0;
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_product_effective_stock', { product_uuid: productId });

      if (error) {
        console.error('fetchEffectiveStock error:', error);
        return 0;
      }

      return Number(data) || 0;
    } catch (error) {
      console.error('fetchEffectiveStock exception:', error);
      return 0;
    }
  }

  // Refresh effective stock for multiple products
  static async fetchEffectiveStockBatch(productIds: string[]): Promise<Map<string, number>> {
    if (!productIds.length) return new Map();
    
    try {
      const stockMap = new Map<string, number>();
      
      // Use database function for each product to get accurate stock
      for (const productId of productIds) {
        const { data, error } = await (supabase as any)
          .rpc('get_product_effective_stock', { product_uuid: productId });

        if (error) {
          console.error(`fetchEffectiveStock error for ${productId}:`, error);
          stockMap.set(productId, 0);
        } else {
          stockMap.set(productId, Number(data) || 0);
        }
      }
      
      return stockMap;
    } catch (error) {
      console.error('fetchEffectiveStockBatch exception:', error);
      return new Map();
    }
  }
}

export default StockCalculationService;
