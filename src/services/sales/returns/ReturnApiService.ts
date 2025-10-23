import { BaseApiService } from '@/services/core/BaseApiService';
import { supabase } from '@/integrations/supabase/client';
import type { SaleReturn, CreateReturnData } from './types';
import type { Sale } from '../types';
import { ReturnCalculationService } from './ReturnCalculationService';

export class ReturnApiService extends BaseApiService<SaleReturn, CreateReturnData> {
  constructor() {
    super('sale_returns');
    this.selectQuery = `
      *,
      sale:sales(
        id, sale_number, sale_date, total_amount,
        client:clients(id, type, first_name, last_name, company_name),
        sale_items(id, product_id, quantity, unit_price, serial_number, product:products(brand, model))
      ),
      returned_by_user:profiles!returned_by(username),
      return_items:sale_return_items(
        id, sale_item_id, product_id, quantity, serial_number,
        return_condition, unit_price, refund_amount,
        product:products(brand, model)
      )
    `;
  }
  
  async createReturn(returnData: CreateReturnData): Promise<SaleReturn> {
    // 1. Fetch original sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`*, sale_items(*)`)
      .eq('id', returnData.sale_id)
      .single();
    
    if (saleError || !sale) {
      throw new Error(`Vendita non trovata: ${saleError?.message || 'Unknown error'}`);
    }
    
    // 2. Validate return
    const validation = ReturnCalculationService.validateReturn(sale as Sale, returnData.items);
    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }
    
    // 3. Calculate refund amounts
    const calculation = ReturnCalculationService.calculateReturn(
      sale.sale_date,
      returnData.items.map(item => {
        const saleItem = sale.sale_items.find((si: any) => si.id === item.sale_item_id);
        return {
          ...item,
          unit_price: saleItem!.unit_price
        };
      })
    );
    
    // 4. Generate return number
    const { data: returnNumber, error: genError } = await supabase.rpc('generate_return_number');
    if (genError) throw new Error(`Errore generazione numero reso: ${genError.message}`);
    
    // 5. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Utente non autenticato');
    
    // 6. Insert return record
    const { data: returnRecord, error: returnError } = await supabase
      .from('sale_returns')
      .insert({
        return_number: returnNumber || `RET-${Date.now()}`,
        sale_id: returnData.sale_id,
        returned_by: user.id,
        return_reason: returnData.return_reason,
        refund_method: returnData.refund_method,
        refund_amount: calculation.refundAmount,
        restocking_fee: calculation.restockingFee,
        status: 'completed', // Auto-complete returns
        notes: returnData.notes
      })
      .select()
      .single();
    
    if (returnError || !returnRecord) {
      throw new Error(`Errore creazione reso: ${returnError?.message || 'Unknown error'}`);
    }
    
    // 7. Insert return items
    const returnItems = returnData.items.map((item, index) => {
      const breakdown = calculation.breakdown[index];
      const saleItem = sale.sale_items.find((si: any) => si.id === item.sale_item_id);
      
      return {
        return_id: returnRecord.id,
        sale_item_id: item.sale_item_id,
        product_id: item.product_id,
        quantity: item.quantity,
        serial_number: item.serial_number,
        return_condition: item.return_condition,
        unit_price: saleItem!.unit_price,
        refund_amount: breakdown.itemRefundAmount
      };
    });
    
    const { error: itemsError } = await supabase
      .from('sale_return_items')
      .insert(returnItems);
    
    if (itemsError) {
      throw new Error(`Errore creazione articoli reso: ${itemsError.message}`);
    }
    
    // 8. Return full record with relations
    return this.getById(returnRecord.id);
  }
  
  async completeReturn(returnId: string): Promise<void> {
    const { error } = await supabase
      .from('sale_returns')
      .update({ status: 'completed' })
      .eq('id', returnId);
    
    if (error) throw new Error(`Errore completamento reso: ${error.message}`);
  }
}
