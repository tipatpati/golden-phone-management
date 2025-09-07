import { BaseApiService } from '../core/BaseApiService';
import { SalesValidationService } from '@/components/sales/SalesValidationService';
import type { Sale, CreateSaleData } from './types';
import { supabase } from '@/integrations/supabase/client';

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

      // Handle unit-level inventory updates
      for (const item of saleData.sale_items) {
        if (item.product_unit_id && item.serial_number) {
          // Update product unit status to 'sold'
          const { error: unitError } = await supabase
            .from('product_units')
            .update({ status: 'sold' })
            .eq('id', item.product_unit_id);

          if (unitError) {
            console.error('Error updating product unit:', unitError);
            // Continue with other items even if one fails
          }

          // Create sold product unit record
          const { error: soldUnitError } = await supabase
            .from('sold_product_units')
            .insert([{
              sale_id: sale.id,
              sale_item_id: null, // Will be populated by trigger if needed
              product_id: item.product_id,
              product_unit_id: item.product_unit_id,
              serial_number: item.serial_number,
              barcode: item.barcode,
              sold_price: item.unit_price,
            }]);

          if (soldUnitError) {
            console.error('Error creating sold product unit record:', soldUnitError);
            // Continue with other items even if one fails
          }
        } else {
          // Handle non-serialized products - will be handled by trigger
          // Stock reduction will be automatic via database trigger
          console.log(`Stock will be reduced for product ${item.product_id} by ${item.quantity} units`);
        }
      }

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