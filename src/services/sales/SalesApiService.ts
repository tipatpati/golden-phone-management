import { BaseApiService } from '../core/BaseApiService';
import { SalesValidationService } from '@/components/sales/SalesValidationService';
import type { Sale, CreateSaleData } from './types';
import { supabase } from '@/integrations/supabase/client';
import { SalesInventoryIntegrationService } from './SalesInventoryIntegrationService';

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
    
    const query = this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .or(`sale_number.ilike.${searchPattern},notes.ilike.${searchPattern}`)
      .order('created_at', { ascending: false });
    
    return this.performQuery(query, 'searching');
  }

  static async createSale(saleData: CreateSaleData): Promise<Sale> {
    try {
      // Pre-validate sale against inventory to ensure consistency
      await SalesInventoryIntegrationService.validatePreSale(saleData);
      // Generate sale number
      const saleNumber = await this.generateSaleNumber();
      
      // Calculate totals
      const subtotal = saleData.sale_items.reduce(
        (sum, item) => sum + (item.quantity * item.unit_price), 
        0
      );
      const taxAmount = subtotal * 0.22; // 22% VAT
      const totalAmount = subtotal + taxAmount;

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
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: saleData.notes || '',
      };

      // Insert sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleToInsert])
        .select('*')
        .single();

      if (saleError) {
        console.error('Error creating sale:', saleError);
        throw new Error(saleError.message);
      }

      // Insert sale items and handle unit-level tracking
      const saleItemsToInsert = saleData.sale_items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        serial_number: item.serial_number,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsToInsert);

      if (itemsError) {
        console.error('Error creating sale items:', itemsError);
        throw new Error(itemsError.message);
      }

      // Inventory updates are handled by database triggers (stock, unit status, sold units)
      console.debug('Inventory updates handled by DB triggers for sale items:', saleData.sale_items.length);

      return sale as Sale;
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