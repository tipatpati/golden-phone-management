/**
 * Sales Exchange Service
 *
 * Handles the exchange workflow where a customer returns items and receives
 * new items in exchange. This is a special case of returns that creates
 * two linked transactions: a return and a new sale.
 */

import { supabase } from '@/integrations/supabase/client';
import { ReturnApiService } from './ReturnApiService';
import type { CreateReturnData, SaleReturn, ReturnCondition } from './types';
import type { CreateSaleData } from '../types';

export interface ExchangeItemReturn {
  sale_item_id: string;
  product_id: string;
  quantity: number;
  serial_number?: string;
  return_condition: ReturnCondition;
}

export interface ExchangeItemNew {
  product_id: string;
  quantity: number;
  unit_price: number;
  serial_number?: string;
}

export interface CreateExchangeData {
  original_sale_id: string;
  return_reason: CreateReturnData['return_reason'];
  return_items: ExchangeItemReturn[];
  new_items: ExchangeItemNew[];
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'hybrid';
  cash_amount?: number;
  card_amount?: number;
  bank_transfer_amount?: number;
  notes?: string;
}

export interface ExchangeResult {
  return: SaleReturn;
  new_sale: any; // Full sale record
  credit_applied: number;
  additional_payment: number;
  refund_issued: number;
  net_difference: number;
}

export class SalesExchangeService {
  private static returnService = new ReturnApiService();

  /**
   * Validates that an exchange is possible for the given sale
   */
  static async validateExchange(
    saleId: string,
    returnItems: ExchangeItemReturn[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // 1. Fetch original sale with items
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('id', saleId)
      .single();

    if (saleError || !sale) {
      errors.push('Sale not found');
      return { valid: false, errors };
    }

    // 2. Check sale status
    if (sale.status === 'cancelled' || sale.status === 'refunded') {
      errors.push(`Cannot exchange from ${sale.status} sale`);
    }

    // 3. Validate each return item
    for (const returnItem of returnItems) {
      const saleItem = (sale.sale_items as any[]).find(
        (si) => si.id === returnItem.sale_item_id
      );

      if (!saleItem) {
        errors.push(`Sale item ${returnItem.sale_item_id} not found in sale`);
        continue;
      }

      // Check if item can still be returned
      if (saleItem.return_status === 'fully_returned') {
        errors.push(
          `Item ${saleItem.product_id} has already been fully returned`
        );
      }

      // Check quantity
      const remainingQuantity = saleItem.quantity - (saleItem.quantity_returned || 0);
      if (returnItem.quantity > remainingQuantity) {
        errors.push(
          `Cannot return ${returnItem.quantity} units - only ${remainingQuantity} remaining`
        );
      }

      // Check serial number for serialized products
      if (saleItem.serial_number && returnItem.serial_number !== saleItem.serial_number) {
        errors.push('Serial number mismatch');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculates the financial details of an exchange
   */
  static calculateExchangeDifference(
    returnRefundAmount: number,
    newItemsTotal: number
  ): {
    credit_applied: number;
    additional_payment: number;
    refund_issued: number;
    net_difference: number;
  } {
    const netDifference = newItemsTotal - returnRefundAmount;

    if (netDifference > 0) {
      // Customer needs to pay more
      return {
        credit_applied: returnRefundAmount,
        additional_payment: netDifference,
        refund_issued: 0,
        net_difference: netDifference
      };
    } else if (netDifference < 0) {
      // Customer gets money back
      return {
        credit_applied: newItemsTotal,
        additional_payment: 0,
        refund_issued: Math.abs(netDifference),
        net_difference: netDifference
      };
    } else {
      // Even exchange
      return {
        credit_applied: returnRefundAmount,
        additional_payment: 0,
        refund_issued: 0,
        net_difference: 0
      };
    }
  }

  /**
   * Creates a complete exchange transaction (return + new sale)
   * This is an atomic operation that creates both records and links them
   */
  static async createExchange(
    exchangeData: CreateExchangeData
  ): Promise<ExchangeResult> {
    // 1. Validate exchange
    const validation = await this.validateExchange(
      exchangeData.original_sale_id,
      exchangeData.return_items
    );

    if (!validation.valid) {
      throw new Error(`Exchange validation failed: ${validation.errors.join('; ')}`);
    }

    // 2. Get original sale data
    const { data: originalSale, error: saleError } = await supabase
      .from('sales')
      .select('*, sale_items(*), client:clients(*)')
      .eq('id', exchangeData.original_sale_id)
      .single();

    if (saleError || !originalSale) {
      throw new Error('Failed to fetch original sale');
    }

    // 3. Create return with refund_method='exchange'
    const returnData: CreateReturnData = {
      sale_id: exchangeData.original_sale_id,
      return_reason: exchangeData.return_reason,
      refund_method: 'exchange',
      notes: exchangeData.notes,
      items: exchangeData.return_items
    };

    const returnRecord = await this.returnService.createReturn(returnData);

    // 4. Calculate new sale totals
    const newSaleSubtotal = exchangeData.new_items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const exchangeCalc = this.calculateExchangeDifference(
      returnRecord.refund_amount,
      newSaleSubtotal
    );

    // 5. Determine payment breakdown for new sale
    let salePaymentMethod = exchangeData.payment_method;
    let cashAmount = exchangeData.cash_amount || 0;
    let cardAmount = exchangeData.card_amount || 0;
    let bankTransferAmount = exchangeData.bank_transfer_amount || 0;

    // If no additional payment needed, use store_credit as payment method
    if (exchangeCalc.additional_payment === 0) {
      salePaymentMethod = 'cash'; // Placeholder, will be noted as exchange credit
      cashAmount = 0;
    }

    // 6. Create new sale using RPC function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const saleData = {
      client_id: originalSale.client_id,
      salesperson_id: user.id,
      payment_method: salePaymentMethod,
      payment_type: 'single',
      cash_amount: cashAmount,
      card_amount: cardAmount,
      bank_transfer_amount: bankTransferAmount,
      discount_amount: exchangeCalc.credit_applied, // Apply return credit as discount
      discount_percentage: 0,
      subtotal: newSaleSubtotal,
      tax_amount: 0,
      total_amount: Math.max(0, exchangeCalc.additional_payment),
      notes: `Cambio da vendita ${originalSale.sale_number}. Credito applicato: €${exchangeCalc.credit_applied.toFixed(2)}`,
      vat_included: originalSale.vat_included
    };

    const saleItems = exchangeData.new_items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
      serial_number: item.serial_number
    }));

    const { data: newSale, error: createSaleError } = await supabase.rpc(
      'create_sale_transaction',
      {
        sale_data: saleData,
        sale_items: saleItems
      }
    );

    if (createSaleError || !newSale) {
      // Rollback: cancel the return
      await supabase
        .from('sale_returns')
        .update({ status: 'cancelled' })
        .eq('id', returnRecord.id);

      throw new Error(`Failed to create exchange sale: ${createSaleError?.message}`);
    }

    // 7. Link the return to the new sale
    const { error: linkError } = await supabase
      .from('sale_returns')
      .update({ exchange_sale_id: newSale.sale_id })
      .eq('id', returnRecord.id);

    if (linkError) {
      console.error('Failed to link exchange sale to return:', linkError);
      // Don't fail the whole transaction, but log the error
    }

    // 8. Return complete exchange result
    const result: ExchangeResult = {
      return: returnRecord,
      new_sale: newSale,
      ...exchangeCalc
    };

    return result;
  }

  /**
   * Gets all exchanges for a store
   */
  static async getExchanges(): Promise<SaleReturn[]> {
    const { data, error } = await supabase
      .from('sale_returns')
      .select(`
        *,
        sale:sales(
          id, sale_number, sale_date, total_amount,
          client:clients(id, type, first_name, last_name, company_name)
        ),
        exchange_sale:sales!exchange_sale_id(
          id, sale_number, sale_date, total_amount
        ),
        returned_by_user:profiles!returned_by(username),
        return_items:sale_return_items(
          id, sale_item_id, product_id, quantity, serial_number,
          return_condition, unit_price, refund_amount,
          product:products(brand, model)
        )
      `)
      .eq('refund_method', 'exchange')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch exchanges: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Gets exchange details by return ID
   */
  static async getExchangeDetails(returnId: string): Promise<ExchangeResult | null> {
    const { data: returnRecord, error: returnError } = await supabase
      .from('sale_returns')
      .select(`
        *,
        sale:sales(*),
        exchange_sale:sales!exchange_sale_id(*),
        return_items:sale_return_items(*)
      `)
      .eq('id', returnId)
      .eq('refund_method', 'exchange')
      .single();

    if (returnError || !returnRecord) {
      return null;
    }

    // Calculate exchange financials
    const newSaleTotal = (returnRecord as any).exchange_sale?.total_amount || 0;
    const returnRefund = returnRecord.refund_amount;

    const exchangeCalc = this.calculateExchangeDifference(returnRefund, newSaleTotal);

    return {
      return: returnRecord as SaleReturn,
      new_sale: (returnRecord as any).exchange_sale,
      ...exchangeCalc
    };
  }

  /**
   * Cancels an exchange (cancels both return and new sale)
   */
  static async cancelExchange(returnId: string): Promise<void> {
    // Get the exchange
    const { data: returnRecord, error } = await supabase
      .from('sale_returns')
      .select('exchange_sale_id')
      .eq('id', returnId)
      .single();

    if (error || !returnRecord) {
      throw new Error('Exchange not found');
    }

    // Cancel the return (this will trigger inventory restoration rollback)
    await supabase
      .from('sale_returns')
      .update({ status: 'cancelled' })
      .eq('id', returnId);

    // Cancel the new sale if it exists
    if (returnRecord.exchange_sale_id) {
      await supabase
        .from('sales')
        .update({ status: 'cancelled' })
        .eq('id', returnRecord.exchange_sale_id);
    }
  }
}
