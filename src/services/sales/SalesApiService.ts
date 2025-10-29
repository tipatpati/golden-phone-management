import { BaseApiService } from '../core/BaseApiService';
import { SalesValidationService } from '@/components/sales/SalesValidationService';
import type { Sale, CreateSaleData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { SalesInventoryIntegrationService } from './SalesInventoryIntegrationService';
import { withStoreId } from '../stores/storeHelpers';

export class SalesApiService extends BaseApiService<Sale, CreateSaleData> {
  constructor() {
    super('sales');
    this.selectQuery = `
      *,
      client:clients(id, type, first_name, last_name, company_name, contact_person, email, phone),
      salesperson:profiles(id, username),
      sale_items(
        id,
        product_id,
        quantity,
        unit_price,
        total_price,
        serial_number,
        product:products(id, brand, model, year)
      )
    `;
  }

  async search(searchTerm: string): Promise<Sale[]> {
    if (!searchTerm.trim()) return this.getAll();
    
    const searchPattern = `%${searchTerm.trim()}%`;
    
    // First, search in sale fields (sale_number, notes)
    const directQuery = this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .or(`sale_number.ilike.${searchPattern},notes.ilike.${searchPattern}`)
      .order('created_at', { ascending: false });
    
    const directSales = await this.performQuery(directQuery, 'searching');
    
    // Second, search for sales by serial number in sale_items
    const { data: serialMatches, error: serialError } = await supabase
      .from('sale_items')
      .select('sale_id')
      .ilike('serial_number', searchPattern);
    
    if (serialError) {
      console.error('Error searching serial numbers:', serialError);
    }
    
    // Third, search for products by brand or model
    const { data: productMatches, error: productError } = await supabase
      .from('products')
      .select('id')
      .or(`brand.ilike.${searchPattern},model.ilike.${searchPattern}`);
    
    if (productError) {
      console.error('Error searching products:', productError);
    }
    
    // Get sale_ids from product matches
    let productSaleIds: string[] = [];
    if (productMatches && productMatches.length > 0) {
      const productIds = productMatches.map(p => p.id);
      const { data: productSaleItems } = await supabase
        .from('sale_items')
        .select('sale_id')
        .in('product_id', productIds);
      
      if (productSaleItems) {
        productSaleIds = productSaleItems.map(item => item.sale_id);
      }
    }
    
    // Combine all matched sale IDs
    const serialSaleIds = serialMatches?.map(item => item.sale_id) || [];
    const allMatchedSaleIds = [...new Set([...serialSaleIds, ...productSaleIds])];
    
    if (allMatchedSaleIds.length === 0) {
      return Array.isArray(directSales) ? directSales : [];
    }
    
    // Fetch full sale data for matched IDs
    const productMatchQuery = this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .in('id', allMatchedSaleIds)
      .order('created_at', { ascending: false });
    
    const productSales = await this.performQuery(productMatchQuery, 'searching products');
    
    // Ensure both are arrays
    const directSalesArray = Array.isArray(directSales) ? directSales : [];
    const productSalesArray = Array.isArray(productSales) ? productSales : [];
    
    // Combine and deduplicate results (prioritize direct matches)
    const directSaleIds = new Set(directSalesArray.map(s => s.id));
    const combinedSales = [
      ...directSalesArray,
      ...productSalesArray.filter(s => !directSaleIds.has(s.id))
    ];
    
    return combinedSales;
  }

  static async createSale(saleData: CreateSaleData): Promise<Sale> {
    // Use a database transaction via RPC to ensure atomicity
    try {
      // Pre-validate sale against inventory (this will fail fast if store context not set)
      await SalesInventoryIntegrationService.validatePreSale(saleData);

      // Generate sale number
      const saleNumber = await this.generateSaleNumber();
      
      // Use calculated totals from frontend if provided, otherwise calculate here
      const subtotal = saleData.subtotal ?? (() => {
        const totalWithVAT = saleData.sale_items.reduce(
          (sum, item) => sum + (item.quantity * item.unit_price), 
          0
        );
        return saleData.vat_included !== false ? totalWithVAT / 1.22 : totalWithVAT;
      })();
      
      const taxAmount = saleData.tax_amount ?? (saleData.vat_included !== false ? subtotal * 0.22 : 0);
      const totalAmount = saleData.total_amount ?? (subtotal + taxAmount);

      // Prepare sale data
      const saleToInsert = {
        sale_number: saleNumber,
        client_id: saleData.client_id,
        salesperson_id: saleData.salesperson_id,
        status: saleData.status || 'completed',
        payment_method: saleData.payment_method,
        payment_type: saleData.payment_type || 'single',
        cash_amount: saleData.cash_amount || 0,
        card_amount: saleData.card_amount || 0,
        bank_transfer_amount: saleData.bank_transfer_amount || 0,
        discount_amount: saleData.discount_amount || 0,
        discount_percentage: saleData.discount_percentage || 0,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(taxAmount * 100) / 100,
        total_amount: Math.round(totalAmount * 100) / 100,
        vat_included: saleData.vat_included !== false,
        notes: saleData.notes || '',
      };

      // Add store_id to sale
      const saleWithStore = await withStoreId(saleToInsert);
      
      // Prepare sale items
      const saleItemsToInsert = saleData.sale_items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        serial_number: item.serial_number,
      }));

      // Call database function to create sale atomically
      // This ensures all-or-nothing: if stock validation fails, nothing is created
      const { data: result, error: rpcError } = await supabase.rpc('create_sale_transaction', {
        p_sale_data: saleWithStore,
        p_sale_items: saleItemsToInsert
      });

      if (rpcError) {
        console.error('Error creating sale transaction:', rpcError);
        throw new Error(rpcError.message);
      }

      if (!result || !result.sale_id) {
        throw new Error('Failed to create sale - no sale ID returned');
      }

      // Fetch the complete sale data with relations
      const { data: fullSale, error: fetchError } = await supabase
        .from('sales')
        .select(`
          *,
          client:clients(id, type, first_name, last_name, company_name, contact_person, email, phone),
          salesperson:profiles(id, username),
          sale_items(
            id,
            product_id,
            quantity,
            unit_price,
            total_price,
            serial_number,
            product:products(id, brand, model, year)
          )
        `)
        .eq('id', result.sale_id)
        .single();

      if (fetchError) {
        console.error('Error fetching created sale:', fetchError);
        throw new Error('Sale created but could not fetch details');
      }

      return fullSale as Sale;
    } catch (error) {
      console.error('Error in createSale:', error);
      throw error;
    }
  }

  private static async generateSaleNumber(): Promise<string> {
    const { data } = await supabase.rpc('generate_sale_number');
    return data || `SAL-${Date.now()}`;
  }

  async create(saleData: CreateSaleData): Promise<Sale> {
    return SalesApiService.createSale(saleData);
  }

  async delete(id: string): Promise<boolean> {
    // Delete sale items first (this will restore stock via triggers)
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);
    
    if (itemsError) {
      this.handleError('deleting sale items', itemsError);
    }
    
    // Delete the sale
    return super.delete(id);
  }
}