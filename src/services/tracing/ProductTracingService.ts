import { supabase } from '@/integrations/supabase/client';
import { ProductTraceResult, TraceTimelineEvent } from './types';

export class ProductTracingService {
  /**
   * Trace a product by its serial number
   */
  static async traceProductBySerial(serialNumber: string): Promise<ProductTraceResult | null> {
    if (!serialNumber || serialNumber.trim() === '') {
      throw new Error('Serial number is required');
    }

    const cleanSerial = serialNumber.trim();

    try {
      // First, find the product unit
      const { data: productUnit, error: unitError } = await supabase
        .from('product_units')
        .select(`
          *,
          products!inner (
            id,
            brand,
            model,
            description,
            barcode,
            category_id,
            categories (
              name
            )
          )
        `)
        .eq('serial_number', cleanSerial)
        .single();

      if (unitError || !productUnit) {
        return null;
      }

      // Get acquisition history from supplier transactions
      const { data: acquisitionData } = await supabase
        .from('supplier_transaction_items')
        .select(`
          unit_cost,
          total_cost,
          supplier_transactions!inner (
            transaction_number,
            transaction_date,
            suppliers (
              name
            )
          )
        `)
        .contains('product_unit_ids', [productUnit.id])
        .order('created_at', { ascending: false })
        .limit(1);

      // Get modification history
      const { data: unitHistory } = await supabase
        .from('product_unit_history')
        .select('*')
        .eq('product_unit_id', productUnit.id)
        .order('changed_at', { ascending: true });

      // Get sale information if sold
      const { data: saleData } = await supabase
        .from('sold_product_units')
        .select('*')
        .eq('serial_number', cleanSerial)
        .single();

      // Build the trace result
      const traceResult: ProductTraceResult = {
        productInfo: {
          id: productUnit.products.id,
          brand: productUnit.products.brand,
          model: productUnit.products.model,
          category: productUnit.products.categories?.name,
          barcode: productUnit.products.barcode,
          description: productUnit.products.description,
        },
        unitDetails: {
          id: productUnit.id,
          serial_number: productUnit.serial_number,
          barcode: productUnit.barcode,
          color: productUnit.color,
          storage: productUnit.storage,
          ram: productUnit.ram,
          battery_level: productUnit.battery_level,
          condition: productUnit.condition,
          status: productUnit.status,
          created_at: productUnit.created_at,
          updated_at: productUnit.updated_at,
        },
        acquisitionHistory: acquisitionData?.[0] ? {
          supplier_name: acquisitionData[0].supplier_transactions.suppliers?.name,
          transaction_number: acquisitionData[0].supplier_transactions.transaction_number,
          transaction_date: acquisitionData[0].supplier_transactions.transaction_date,
          unit_cost: acquisitionData[0].unit_cost,
          purchase_price: productUnit.purchase_price,
          purchase_date: productUnit.purchase_date,
        } : undefined,
        modificationHistory: unitHistory || [],
        saleInfo: saleData ? {
          sale_id: saleData.sale_id,
          sale_number: saleData.sale_number,
          sold_price: saleData.sold_price,
          sold_at: saleData.sold_at,
          customer_name: saleData.customer_name,
          salesperson_name: saleData.salesperson_name,
          payment_method: saleData.payment_method,
        } : undefined,
        currentStatus: productUnit.status as ProductTraceResult['currentStatus'],
      };

      return traceResult;
    } catch (error) {
      console.error('Error tracing product:', error);
      throw new Error('Failed to trace product');
    }
  }

  /**
   * Generate timeline events from trace result
   */
  static generateTimelineEvents(traceResult: ProductTraceResult): TraceTimelineEvent[] {
    const events: TraceTimelineEvent[] = [];

    // Acquisition event
    if (traceResult.acquisitionHistory) {
      events.push({
        id: `acquisition-${traceResult.unitDetails.id}`,
        type: 'acquisition',
        date: traceResult.acquisitionHistory.transaction_date || traceResult.unitDetails.created_at,
        title: 'Product Acquired',
        description: traceResult.acquisitionHistory.supplier_name 
          ? `Acquired from ${traceResult.acquisitionHistory.supplier_name}`
          : 'Added to inventory',
        icon: 'Package',
        data: traceResult.acquisitionHistory,
      });
    }

    // Modification events
    traceResult.modificationHistory.forEach((history, index) => {
      events.push({
        id: `modification-${history.id}`,
        type: 'modification',
        date: history.changed_at,
        title: `Product ${history.operation_type}`,
        description: history.note || `Product ${history.operation_type}`,
        icon: 'Edit',
        data: history,
      });
    });

    // Sale event
    if (traceResult.saleInfo) {
      events.push({
        id: `sale-${traceResult.saleInfo.sale_id}`,
        type: 'sale',
        date: traceResult.saleInfo.sold_at,
        title: 'Product Sold',
        description: `Sold to ${traceResult.saleInfo.customer_name || 'customer'} for €${traceResult.saleInfo.sold_price}`,
        icon: 'ShoppingCart',
        data: traceResult.saleInfo,
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Search for serial numbers with suggestions
   */
  static async searchSerialSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
      .from('product_units')
      .select('serial_number')
      .ilike('serial_number', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching serial suggestions:', error);
      return [];
    }

    return data.map(item => item.serial_number);
  }
}