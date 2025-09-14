import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/roles';
import { createRoleAwareSelect, sanitizePurchasePriceArray } from '@/utils/purchasePriceUtils';

export class ProductUnitSecureService {
  /**
   * Fetch product units with role-based purchase price filtering
   */
  static async getProductUnits(userRole: UserRole | null, productId?: string) {
    let query = supabase
      .from('product_units')
      .select(createRoleAwareSelect(userRole));
    
    if (productId) {
      query = query.eq('product_id', productId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Additional client-side sanitization as a safety net
    return sanitizePurchasePriceArray(data || [], userRole);
  }

  /**
   * Fetch a single product unit with role-based purchase price filtering
   */
  static async getProductUnit(unitId: string, userRole: UserRole | null) {
    const { data, error } = await supabase
      .from('product_units')
      .select(createRoleAwareSelect(userRole))
      .eq('id', unitId)
      .single();
    
    if (error) throw error;
    
    // Log access attempt for audit
    if (userRole !== 'super_admin') {
      await supabase.rpc('log_purchase_price_access_attempt');
    }
    
    return data;
  }
}