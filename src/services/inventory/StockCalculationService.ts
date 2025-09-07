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

  // Fetch effective stock from DB view when needed (server-authoritative)
  static async fetchEffectiveStock(productId: string): Promise<number> {
    if (!productId) return 0;
    const { data, error } = await (supabase as any)
      .from('product_effective_stock')
      .select('effective_stock')
      .eq('product_id', productId)
      .maybeSingle();

    if (error) {
      console.error('fetchEffectiveStock error:', error);
      return 0;
    }

    return Number((data as any)?.effective_stock) || 0;
  }
}

export default StockCalculationService;
