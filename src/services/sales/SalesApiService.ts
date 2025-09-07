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

  async create(saleData: CreateSaleData): Promise<Sale> {
    console.log('Creating sale with data:', saleData);
    
    // Enhanced validation
    const validation = await SalesValidationService.validateSaleData(saleData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Validate stock for products (if using legacy products)
    const legacyItems = saleData.sale_items.filter(item => !item.product_unit_id);
    if (legacyItems.length > 0) {
      const productItems = legacyItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));
      
      const { error: stockError } = await supabase.rpc('validate_product_stock', {
        product_items: productItems
      });
      
      if (stockError) {
        throw new Error(stockError.message || 'Insufficient stock for one or more products');
      }
    }

    // Validate product units are available
    const unitItems = saleData.sale_items.filter(item => item.product_unit_id);
    for (const item of unitItems) {
      const { data: unit, error: unitError } = await supabase
        .from('product_units')
        .select('status')
        .eq('id', item.product_unit_id)
        .single();

      if (unitError || !unit) {
        throw new Error(`Product unit not found: ${item.product_unit_id}`);
      }

      if (unit.status !== 'available') {
        throw new Error(`Product unit ${item.serial_number} is not available (status: ${unit.status})`);
      }
    }

    // Calculate subtotal, tax, and total
    const subtotal = saleData.sale_items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const discountAmount = saleData.discount_amount || 0;
    const discountPercentage = saleData.discount_percentage || 0;
    const finalDiscount = discountAmount + (subtotal * discountPercentage / 100);
    const discountedSubtotal = subtotal - finalDiscount;
    const taxAmount = discountedSubtotal * 0.22; // 22% VAT
    const totalAmount = discountedSubtotal + taxAmount;

    // Create the sale record
    const saleRecord = {
      client_id: saleData.client_id || null,
      salesperson_id: saleData.salesperson_id,
      status: saleData.status || 'completed',
      payment_method: saleData.payment_method,
      payment_type: saleData.payment_type || 'single',
      cash_amount: saleData.cash_amount || 0,
      card_amount: saleData.card_amount || 0,
      bank_transfer_amount: saleData.bank_transfer_amount || 0,
      discount_amount: finalDiscount,
      discount_percentage: saleData.discount_percentage || 0,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes: saleData.notes || null
    };

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(saleRecord)
      .select(this.selectQuery)
      .single();

    if (saleError || !sale) {
      throw new Error(saleError?.message || 'Failed to create sale');
    }

    try {
      // Create sale items and handle product units
      const saleItemsData = [];
      const soldUnitsData = [];

      for (const item of saleData.sale_items) {
        const saleItemData = {
          sale_id: (sale as any).id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
          serial_number: item.serial_number || null
        };
        saleItemsData.push(saleItemData);

        // If this item has a product_unit_id, track the sold unit
        if (item.product_unit_id && item.serial_number) {
          // Update unit status to 'sold'
          const { error: unitUpdateError } = await supabase
            .from('product_units')
            .update({ status: 'sold', updated_at: new Date().toISOString() })
            .eq('id', item.product_unit_id);

          if (unitUpdateError) {
            throw new Error(`Failed to update unit status: ${unitUpdateError.message}`);
          }

          // Prepare sold unit data
          const soldUnitData = {
            sale_id: (sale as any).id,
            sale_item_id: '', // Will be filled after sale items are created
            product_id: item.product_id,
            product_unit_id: item.product_unit_id,
            serial_number: item.serial_number,
            barcode: item.barcode || null,
            sold_price: item.unit_price
          };
          soldUnitsData.push(soldUnitData);
        }
      }

      // Insert sale items
      const { data: createdSaleItems, error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsData)
        .select('id, product_id, serial_number');

      if (itemsError) {
        // Clean up the sale if item creation fails
        await supabase.from('sales').delete().eq('id', (sale as any).id);
        throw new Error(itemsError.message);
      }

      // Update sold units data with sale_item_ids and insert
      if (soldUnitsData.length > 0 && createdSaleItems) {
        for (let i = 0; i < soldUnitsData.length; i++) {
          const matchingSaleItem = createdSaleItems.find(si => 
            si.product_id === soldUnitsData[i].product_id && 
            si.serial_number === soldUnitsData[i].serial_number
          );
          if (matchingSaleItem) {
            soldUnitsData[i].sale_item_id = matchingSaleItem.id;
          }
        }

        const { error: soldUnitsError } = await supabase
          .from('sold_product_units')
          .insert(soldUnitsData);

        if (soldUnitsError) {
          console.error('Warning: Failed to track sold units:', soldUnitsError.message);
          // Don't fail the sale for this, just log the warning
        }
      }

      return sale;
    } catch (error) {
      // Clean up the sale if anything fails
      await supabase.from('sales').delete().eq('id', (sale as any).id);
      throw error;
    }
  }

  async update(id: string, saleData: Partial<CreateSaleData>): Promise<Sale> {
    // Handle sale items updates if provided
    if (saleData.sale_items) {
      // Validate stock for new quantities (legacy items only)
      const legacyItems = saleData.sale_items.filter(item => !item.product_unit_id);
      if (legacyItems.length > 0) {
        const productItems = legacyItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }));
        
        const { error: stockError } = await supabase.rpc('validate_product_stock', {
          product_items: productItems
        });
        
        if (stockError) {
          throw new Error(stockError.message || 'Insufficient stock for one or more products');
        }
      }
      
      // TODO: Handle product unit updates (restore old units, mark new ones as sold)
      // This would require additional logic to track which units changed
      
      // Delete existing sale items
      const { error: deleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);
      
      if (deleteError) {
        this.handleError('deleting old sale items', deleteError);
      }
      
      // Create new sale items
      const saleItems = saleData.sale_items.map(item => ({
        sale_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        serial_number: item.serial_number
      }));
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);
      
      if (itemsError) {
        this.handleError('creating new sale items', itemsError);
      }
      
      // Recalculate totals
      const subtotal = saleData.sale_items.reduce((sum, item) => 
        sum + (item.unit_price * item.quantity), 0
      );
      const taxAmount = subtotal * 0.22;
      const totalAmount = subtotal + taxAmount;
      
      // Update sale with new totals
      const updateData = {
        ...saleData,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        sale_items: undefined // Remove from update object
      };
      
      return super.update(id, updateData as Partial<CreateSaleData>);
    }
    
    // Simple update without item changes
    return super.update(id, saleData);
  }

  async delete(id: string): Promise<boolean> {
    // Delete sale items first (this will restore stock and mark units as available via triggers)
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);
    
    if (itemsError) {
      this.handleError('deleting sale items', itemsError);
    }
    
    // Delete sold units tracking
    await supabase
      .from('sold_product_units')
      .delete()
      .eq('sale_id', id);
    
    // Delete the sale
    return super.delete(id);
  }
}