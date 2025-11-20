/**
 * Exchange Transaction Service
 * Handles business logic for trade-in/exchange transactions
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentStoreId } from '@/services/stores/storeHelpers';
import type {
  CreateExchangeData,
  ExchangeTransaction,
  ExchangeCalculation,
  ExchangeFilters,
  TradeInCondition,
} from './types';

export class ExchangeTransactionService {
  /**
   * Assess trade-in value based on condition
   * This provides suggested values, user can override
   */
  static assessTradeInValue(
    basePrice: number,
    condition: TradeInCondition
  ): number {
    const conditionMultipliers = {
      excellent: 0.75,
      good: 0.60,
      fair: 0.45,
      poor: 0.30,
    };

    return Math.round(basePrice * conditionMultipliers[condition]);
  }

  /**
   * Calculate exchange financial breakdown
   */
  static calculateExchange(
    tradeInTotal: number,
    purchaseTotal: number
  ): ExchangeCalculation {
    const netDifference = purchaseTotal - tradeInTotal;

    return {
      trade_in_total: tradeInTotal,
      purchase_total: purchaseTotal,
      net_difference: netDifference,
      client_pays: netDifference > 0,
      client_receives: netDifference < 0,
      even_exchange: netDifference === 0,
    };
  }

  /**
   * Create complete exchange transaction
   */
  static async createExchange(
    data: CreateExchangeData
  ): Promise<{ success: boolean; exchange_id: string; exchange_number: string }> {
    const storeId = await getCurrentStoreId();

    if (!storeId) {
      throw new Error('No store context found');
    }

    // Prepare exchange data
    const exchangeData = {
      store_id: storeId,
      client_id: data.client_id || null,
      salesperson_id: data.salesperson_id,
      trade_in_total: data.trade_in_total,
      trade_in_assessment_notes: data.trade_in_assessment_notes || null,
      purchase_total: data.purchase_total,
      net_difference: data.net_difference,
      payment_method: data.payment_method,
      cash_amount: data.cash_amount,
      card_amount: data.card_amount,
      bank_transfer_amount: data.bank_transfer_amount,
      status: 'completed',
      exchange_date: new Date().toISOString(),
      notes: data.notes || null,
    };

    // Prepare trade-in items data
    const tradeInItemsData = data.trade_in_items.map((item) => ({
      product_id: item.product_id || null,
      custom_product_description: item.custom_product_description || null,
      brand: item.brand,
      model: item.model,
      serial_number: item.serial_number || null,
      imei: item.imei || null,
      condition: item.condition,
      assessed_value: item.assessed_value,
      assessment_notes: item.assessment_notes || null,
      was_originally_sold_here: item.was_originally_sold_here,
      original_sale_id: item.original_sale_id || null,
      original_sale_item_id: item.original_sale_item_id || null,
    }));

    // Prepare new items data (for sale)
    const newItemsData = data.new_items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      serial_number: item.serial_number || null,
    }));

    // Call database function to create exchange atomically
    const { data: result, error } = await supabase.rpc(
      'create_exchange_transaction',
      {
        exchange_data: exchangeData,
        trade_in_items_data: tradeInItemsData,
        new_items_data: newItemsData,
      }
    );

    if (error) {
      console.error('Exchange creation error:', error);
      throw new Error(`Failed to create exchange: ${error.message}`);
    }

    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response from exchange creation');
    }

    const resultData = result as any;
    
    if (!resultData.success) {
      throw new Error('Exchange creation failed');
    }

    return {
      success: true,
      exchange_id: resultData.exchange_id,
      exchange_number: resultData.exchange_number,
    };
  }

  /**
   * Get all exchanges with filters
   */
  static async getExchanges(
    filters?: ExchangeFilters
  ): Promise<ExchangeTransaction[]> {
    let query = supabase
      .from('exchange_transactions')
      .select(
        `
        *,
        client:clients(id, first_name, last_name, company_name, type),
        salesperson:profiles!exchange_transactions_salesperson_id_fkey(id, username),
        trade_in_items:exchange_trade_in_items(*),
        new_sale:sales(*)
      `
      )
      .order('exchange_date', { ascending: false });

    if (filters?.store_id) {
      query = query.eq('store_id', filters.store_id);
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.salesperson_id) {
      query = query.eq('salesperson_id', filters.salesperson_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.date_from) {
      query = query.gte('exchange_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('exchange_date', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching exchanges:', error);
      throw new Error(`Failed to fetch exchanges: ${error.message}`);
    }

    return (data as any[]) || [];
  }

  /**
   * Get exchange details by ID
   */
  static async getExchangeDetails(id: string): Promise<ExchangeTransaction> {
    const { data, error } = await supabase
      .from('exchange_transactions')
      .select(
        `
        *,
        client:clients(id, first_name, last_name, company_name, type, phone, email),
        salesperson:profiles!exchange_transactions_salesperson_id_fkey(id, username),
        trade_in_items:exchange_trade_in_items(*),
        new_sale:sales(
          *,
          sale_items(
            *,
            product:products(brand, model)
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching exchange details:', error);
      throw new Error(`Failed to fetch exchange details: ${error.message}`);
    }

    if (!data) {
      throw new Error('Exchange not found');
    }

    return data as any;
  }

  /**
   * Cancel exchange (rollback inventory, cancel linked sale)
   */
  static async cancelExchange(id: string): Promise<void> {
    const { error } = await supabase
      .from('exchange_transactions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling exchange:', error);
      throw new Error(`Failed to cancel exchange: ${error.message}`);
    }

    // Note: Inventory rollback would need to be handled separately
    // This is a simplified implementation
  }

  /**
   * Get condition label in Italian
   */
  static getConditionLabel(condition: TradeInCondition): string {
    const labels: Record<TradeInCondition, string> = {
      excellent: 'Eccellente',
      good: 'Buono',
      fair: 'Discreto',
      poor: 'Scadente',
    };
    return labels[condition];
  }
}
