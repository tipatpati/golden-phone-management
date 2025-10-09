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
          id,
          unit_cost,
          total_cost,
          quantity,
          product_id,
          unit_details,
          supplier_transactions!inner (
            id,
            transaction_number,
            transaction_date,
            type,
            status,
            notes,
            suppliers (
              id,
              name,
              contact_person,
              email,
              phone
            )
          ),
          products (
            id,
            brand,
            model,
            description,
            barcode,
            has_serial,
            category_id,
            categories (
              name
            )
          )
        `)
        .contains('product_unit_ids', [productUnit.id])
        .order('created_at', { ascending: false })
        .limit(1);

      // Get all transaction items for the same transaction to show complete details
      let allTransactionItems = null;
      if (acquisitionData?.[0]) {
        const { data: transactionItems } = await supabase
          .from('supplier_transaction_items')
          .select(`
            id,
            product_id,
            quantity,
            unit_cost,
            total_cost,
            unit_details,
            products (
              id,
              brand,
              model,
              description,
              barcode,
              has_serial,
              category_id,
              categories (
                name
              )
            )
          `)
          .eq('transaction_id', acquisitionData[0].supplier_transactions.id);
        
        allTransactionItems = transactionItems;
      }

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

      // Get detailed sale information if sold
      let detailedSaleData = null;
      if (saleData?.sale_id) {
        const { data: saleDetails } = await supabase
          .from('sales')
          .select(`
            id,
            sale_number,
            subtotal,
            tax_amount,
            discount_amount,
            total_amount,
            payment_method,
            payment_type,
            notes,
            clients (
              id,
              type,
              first_name,
              last_name,
              company_name,
              email,
              phone
            ),
            profiles (
              username
            )
          `)
          .eq('id', saleData.sale_id)
          .single();
        
        detailedSaleData = saleDetails;
      }

      // Get all sale items for the same sale to show complete details
      let allSaleItems = null;
      if (saleData?.sale_id) {
        const { data: saleItems } = await supabase
          .from('sale_items')
          .select(`
            id,
            product_id,
            serial_number,
            quantity,
            unit_price,
            total_price,
            products (
              id,
              brand,
              model,
              description,
              barcode,
              has_serial,
              category_id,
              categories (
                name
              )
            )
          `)
          .eq('sale_id', saleData.sale_id);
        
        allSaleItems = saleItems;
      }

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
          supplier_id: acquisitionData[0].supplier_transactions.suppliers?.id,
          supplier_name: acquisitionData[0].supplier_transactions.suppliers?.name,
          supplier_contact: acquisitionData[0].supplier_transactions.suppliers?.contact_person,
          supplier_email: acquisitionData[0].supplier_transactions.suppliers?.email,
          supplier_phone: acquisitionData[0].supplier_transactions.suppliers?.phone,
          transaction_id: acquisitionData[0].supplier_transactions.id,
          transaction_number: acquisitionData[0].supplier_transactions.transaction_number,
          transaction_type: acquisitionData[0].supplier_transactions.type,
          transaction_date: acquisitionData[0].supplier_transactions.transaction_date,
          transaction_status: acquisitionData[0].supplier_transactions.status,
          unit_cost: acquisitionData[0].unit_cost,
          total_cost: acquisitionData[0].total_cost,
          quantity: acquisitionData[0].quantity,
          purchase_price: productUnit.purchase_price,
          purchase_date: productUnit.purchase_date,
          notes: acquisitionData[0].supplier_transactions.notes,
          transaction_items: allTransactionItems?.map(item => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
            product_details: {
              brand: item.products.brand,
              model: item.products.model,
              category: item.products.categories?.name,
              description: item.products.description,
              barcode: item.products.barcode,
              has_serial: item.products.has_serial,
            },
            unit_details: item.unit_details?.entries || [],
          })) || [],
        } : undefined,
        modificationHistory: unitHistory || [],
        saleInfo: saleData ? {
          sale_id: saleData.sale_id,
          sale_number: saleData.sale_number,
          sold_price: saleData.sold_price,
          sold_at: saleData.sold_at,
          customer_name: saleData.customer_name,
          customer_type: detailedSaleData?.clients?.type,
          customer_email: detailedSaleData?.clients?.email,
          customer_phone: detailedSaleData?.clients?.phone,
          salesperson_name: detailedSaleData?.profiles?.username || saleData.salesperson_name,
          payment_method: saleData.payment_method || detailedSaleData?.payment_method,
          payment_type: detailedSaleData?.payment_type,
          subtotal: detailedSaleData?.subtotal,
          tax_amount: detailedSaleData?.tax_amount,
          discount_amount: detailedSaleData?.discount_amount,
          total_amount: detailedSaleData?.total_amount,
          notes: detailedSaleData?.notes,
          sale_items: allSaleItems?.map(item => ({
            id: item.id,
            product_id: item.product_id,
            serial_number: item.serial_number,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
            product_details: {
              brand: item.products.brand,
              model: item.products.model,
              category: item.products.categories?.name,
              description: item.products.description,
              barcode: item.products.barcode,
              has_serial: item.products.has_serial,
            },
          })) || [],
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

  /**
   * Get product state at a specific point in time
   */
  static async getProductStateAtTime(serialNumber: string, timestamp: string): Promise<any> {
    const traceResult = await this.traceProductBySerial(serialNumber);
    if (!traceResult) return null;

    const { ProductStateReconstructor } = await import('./ProductStateReconstructor');
    const timeline = ProductStateReconstructor.reconstructTimeline(traceResult);
    return ProductStateReconstructor.getStateAtTime(timeline, timestamp);
  }

  /**
   * Search products by various criteria (reverse lookup)
   */
  static async searchProductsBySupplier(supplierId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('product_units')
      .select('serial_number')
      .eq('supplier_id', supplierId);

    if (error) return [];
    return data.map(item => item.serial_number);
  }

  static async searchProductsByCustomer(customerName: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('sold_product_units')
      .select('serial_number')
      .ilike('customer_name', `%${customerName}%`);

    if (error) return [];
    return data.map(item => item.serial_number);
  }

  static async searchProductsByDateRange(startDate: string, endDate: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('product_units')
      .select('serial_number')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) return [];
    return data.map(item => item.serial_number);
  }
}