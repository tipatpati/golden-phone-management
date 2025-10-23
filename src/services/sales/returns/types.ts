import type { Sale } from '../types';

export type ReturnReason = 
  | 'customer_request'
  | 'defective'
  | 'wrong_item'
  | 'damaged_on_arrival'
  | 'changed_mind'
  | 'warranty_claim'
  | 'other';

export type RefundMethod = 
  | 'cash'
  | 'card'
  | 'bank_transfer'
  | 'store_credit'
  | 'exchange';

export type ReturnCondition = 
  | 'new'        // Unopened, original packaging
  | 'good'       // Used but functional
  | 'damaged'    // Physical damage
  | 'defective'; // Not working properly

export interface SaleReturn {
  id: string;
  return_number: string;
  sale_id: string;
  returned_by: string;
  return_date: string;
  return_reason: ReturnReason;
  refund_amount: number;
  restocking_fee: number;
  refund_method: RefundMethod;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Relations
  sale?: Sale;
  returned_by_user?: { username: string };
  return_items?: SaleReturnItem[];
}

export interface SaleReturnItem {
  id: string;
  return_id: string;
  sale_item_id: string;
  product_id: string;
  quantity: number;
  serial_number?: string;
  return_condition: ReturnCondition;
  unit_price: number;
  refund_amount: number;
  created_at: string;
  // Relations
  product?: { brand: string; model: string };
}

export interface CreateReturnData {
  sale_id: string;
  return_reason: ReturnReason;
  refund_method: RefundMethod;
  notes?: string;
  items: {
    sale_item_id: string;
    product_id: string;
    quantity: number;
    serial_number?: string;
    return_condition: ReturnCondition;
  }[];
}

export interface ReturnCalculation {
  originalAmount: number;
  restockingFee: number;
  refundAmount: number;
  breakdown: {
    itemId: string;
    itemOriginalPrice: number;
    itemRestockingFee: number;
    itemRefundAmount: number;
  }[];
}
