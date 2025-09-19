import { supabase } from '@/integrations/supabase/client';

export interface SoldProductUnit {
  id: string;
  sale_id: string;
  sale_item_id: string;
  product_id: string;
  product_unit_id: string;
  serial_number: string;
  barcode?: string;
  sold_price: number;
  sold_at: string;
  sale_number?: string;
  customer_name?: string;
  payment_method?: string;
  salesperson_name?: string;
  original_purchase_price?: number;
  supplier_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductSalesMetrics {
  total_units_sold: number;
  total_revenue: number;
  total_profit: number;
  average_profit_margin: number;
  best_performing_month: string;
  units_sold_by_month: Array<{
    month: string;
    units: number;
    revenue: number;
  }>;
}

export interface SoldProductsFilters {
  product_id?: string;
  customer_name?: string;
  salesperson_name?: string;
  sale_number?: string;
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  supplier_name?: string;
}

export class SoldProductsTrackingService {
  /**
   * Get sold units for a specific product
   */
  static async getSoldUnitsForProduct(productId: string, filters?: SoldProductsFilters) {
    let query = supabase
      .from('sold_product_units')
      .select(`
        *,
        sales!inner(sale_number, payment_method, sale_date),
        products!inner(brand, model)
      `)
      .eq('product_id', productId);

    if (filters?.customer_name) {
      query = query.ilike('customer_name', `%${filters.customer_name}%`);
    }

    if (filters?.salesperson_name) {
      query = query.ilike('salesperson_name', `%${filters.salesperson_name}%`);
    }

    if (filters?.payment_method) {
      query = query.eq('payment_method', filters.payment_method);
    }

    if (filters?.date_from) {
      query = query.gte('sold_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('sold_at', filters.date_to);
    }

    if (filters?.supplier_name) {
      query = query.ilike('supplier_name', `%${filters.supplier_name}%`);
    }

    const { data, error } = await query.order('sold_at', { ascending: false });

    if (error) throw error;
    return data as SoldProductUnit[];
  }

  /**
   * Get sales metrics for a product
   */
  static async getProductSalesMetrics(productId: string): Promise<ProductSalesMetrics> {
    const { data, error } = await supabase
      .from('sold_product_units')
      .select('sold_price, original_purchase_price, sold_at')
      .eq('product_id', productId);

    if (error) throw error;

    const units = data || [];
    const totalUnitsSold = units.length;
    const totalRevenue = units.reduce((sum, unit) => sum + (unit.sold_price || 0), 0);
    const totalProfit = units.reduce((sum, unit) => {
      const profit = (unit.sold_price || 0) - (unit.original_purchase_price || 0);
      return sum + (profit > 0 ? profit : 0);
    }, 0);
    const averageProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Group by month for trend analysis
    const salesByMonth = units.reduce((acc, unit) => {
      const month = unit.sold_at.substring(0, 7); // YYYY-MM format
      if (!acc[month]) {
        acc[month] = { units: 0, revenue: 0 };
      }
      acc[month].units += 1;
      acc[month].revenue += unit.sold_price || 0;
      return acc;
    }, {} as Record<string, { units: number; revenue: number }>);

    const unitsSoldByMonth = Object.entries(salesByMonth)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const bestPerformingMonth = unitsSoldByMonth.reduce(
      (best, current) => current.revenue > best.revenue ? current : best,
      { month: '', revenue: 0 }
    ).month;

    return {
      total_units_sold: totalUnitsSold,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      average_profit_margin: averageProfitMargin,
      best_performing_month: bestPerformingMonth,
      units_sold_by_month: unitsSoldByMonth
    };
  }

  /**
   * Search sold products across all products
   */
  static async searchSoldProducts(filters: SoldProductsFilters) {
    let query = supabase
      .from('sold_product_units')
      .select(`
        *,
        products!inner(brand, model, category_id),
        sales!inner(sale_number, payment_method, sale_date, total_amount)
      `);

    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id);
    }

    if (filters.customer_name) {
      query = query.ilike('customer_name', `%${filters.customer_name}%`);
    }

    if (filters.salesperson_name) {
      query = query.ilike('salesperson_name', `%${filters.salesperson_name}%`);
    }

    if (filters.sale_number) {
      query = query.ilike('sale_number', `%${filters.sale_number}%`);
    }

    if (filters.payment_method) {
      query = query.eq('payment_method', filters.payment_method);
    }

    if (filters.date_from) {
      query = query.gte('sold_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('sold_at', filters.date_to);
    }

    if (filters.supplier_name) {
      query = query.ilike('supplier_name', `%${filters.supplier_name}%`);
    }

    const { data, error } = await query
      .order('sold_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  }

  /**
   * Get profit analysis for sold products
   */
  static async getProfitAnalysis(productId?: string) {
    let query = supabase
      .from('sold_product_units')
      .select(`
        sold_price,
        original_purchase_price,
        sold_at,
        products!inner(brand, model)
      `);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query.not('original_purchase_price', 'is', null);

    if (error) throw error;

    return (data || []).map(unit => ({
      ...unit,
      profit: (unit.sold_price || 0) - (unit.original_purchase_price || 0),
      profit_margin: unit.sold_price > 0 
        ? (((unit.sold_price || 0) - (unit.original_purchase_price || 0)) / unit.sold_price) * 100 
        : 0
    }));
  }

  /**
   * Get customer purchase history
   */
  static async getCustomerPurchaseHistory(customerName: string) {
    const { data, error } = await supabase
      .from('sold_product_units')
      .select(`
        *,
        products!inner(brand, model),
        sales!inner(sale_number, sale_date, total_amount)
      `)
      .ilike('customer_name', `%${customerName}%`)
      .order('sold_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}