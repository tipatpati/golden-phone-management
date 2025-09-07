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
    console.log('🔄 fetchEffectiveStockBatch called with:', productIds);
    
    // Filter out invalid IDs
    const validIds = productIds.filter(id => id && typeof id === 'string' && id.trim() !== '');
    console.log('✅ Valid product IDs:', validIds);
    
    if (!validIds.length) {
      console.log('⚠️ No valid product IDs provided');
      return new Map();
    }
    
    try {
      const stockMap = new Map<string, number>();
      
      // Use database function for each product to get accurate stock
      for (const productId of validIds) {
        console.log(`📦 Fetching stock for product: ${productId}`);
        
        const { data, error } = await (supabase as any)
          .rpc('get_product_effective_stock', { product_uuid: productId });

        if (error) {
          console.error(`❌ fetchEffectiveStock error for ${productId}:`, error);
          stockMap.set(productId, 0);
        } else {
          const stockValue = Number(data) || 0;
          console.log(`✅ Stock for ${productId}: ${stockValue}`);
          stockMap.set(productId, stockValue);
        }
      }
      
      console.log('📊 Final stock map:', Object.fromEntries(stockMap));
      return stockMap;
    } catch (error) {
      console.error('❌ fetchEffectiveStockBatch exception:', error);
      return new Map();
    }
  }
}

export default StockCalculationService;
