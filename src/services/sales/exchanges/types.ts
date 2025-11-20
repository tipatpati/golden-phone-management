/**
 * Exchange/Cambio Transaction Type Definitions
 */

import type { Sale } from '../types';

export type TradeInCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface TradeInItem {
  id?: string;
  product_id?: string;
  custom_product_description?: string;
  brand: string;
  model: string;
  serial_number?: string;
  imei?: string;
  condition: TradeInCondition;
  assessed_value: number;
  assessment_notes?: string;
  was_originally_sold_here: boolean;
  original_sale_id?: string;
  original_sale_item_id?: string;
}

export interface NewPurchaseItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_number?: string;
}

export interface ExchangeTransaction {
  id: string;
  exchange_number: string;
  store_id: string;
  client_id?: string;
  salesperson_id: string;
  
  trade_in_total: number;
  trade_in_assessment_notes?: string;
  
  purchase_total: number;
  
  net_difference: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'hybrid';
  cash_amount: number;
  card_amount: number;
  bank_transfer_amount: number;
  
  status: 'completed' | 'cancelled';
  exchange_date: string;
  notes?: string;
  
  original_sale_id?: string;
  new_sale_id?: string;
  
  created_at: string;
  updated_at: string;
  
  // Relations
  trade_in_items?: TradeInItem[];
  new_sale?: Sale;
  client?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    type: string;
  };
  salesperson?: {
    id: string;
    username: string;
  };
}

export interface CreateExchangeData {
  store_id: string;
  client_id?: string;
  salesperson_id: string;
  trade_in_items: TradeInItem[];
  new_items: NewPurchaseItem[];
  trade_in_total: number;
  purchase_total: number;
  net_difference: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'hybrid';
  cash_amount: number;
  card_amount: number;
  bank_transfer_amount: number;
  notes?: string;
  trade_in_assessment_notes?: string;
}

export interface ExchangeCalculation {
  trade_in_total: number;
  purchase_total: number;
  net_difference: number;
  client_pays: boolean;
  client_receives: boolean;
  even_exchange: boolean;
}

export interface ExchangeFilters {
  store_id?: string;
  client_id?: string;
  salesperson_id?: string;
  status?: 'completed' | 'cancelled';
  date_from?: string;
  date_to?: string;
}
