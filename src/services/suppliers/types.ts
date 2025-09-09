import type { BaseEntity } from '../core/BaseApiService';

// ============= SUPPLIER TYPES =============
export interface Supplier extends BaseEntity {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  status: 'active' | 'inactive';
}

export type CreateSupplierData = Omit<Supplier, keyof BaseEntity>;

// ============= TRANSACTION TYPES =============
export interface SupplierTransaction extends BaseEntity {
  supplier_id: string;
  transaction_number: string;
  type: 'purchase' | 'payment' | 'return';
  total_amount: number;
  transaction_date: string;
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  // Relations
  suppliers?: {
    name: string;
  };
}

export interface SupplierTransactionItem extends BaseEntity {
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  unit_details?: {
    barcodes?: string[];
    serial_numbers?: string[];
    [key: string]: any;
  };
  // Relations for display
  products?: {
    brand: string;
    model: string;
    has_serial: boolean;
  };
}

// ============= FORM DATA TYPES =============
export interface CreateTransactionData {
  supplier_id: string;
  type: 'purchase' | 'payment' | 'return';
  total_amount: number;
  transaction_date: string;
  notes?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  items: CreateTransactionItemData[];
}

export interface CreateTransactionItemData {
  product_id: string;
  quantity: number;
  unit_cost: number;
  unit_barcodes?: string[];
}

export interface UpdateTransactionData {
  type?: 'purchase' | 'payment' | 'return';
  status?: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  transaction_date?: string;
  total_amount?: number;
}

export interface EditableTransactionItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  unit_barcodes?: string[];
}

// ============= SEARCH AND FILTER TYPES =============
export interface SupplierSearchFilters {
  searchTerm?: string;
  status?: 'active' | 'inactive' | 'all';
  hasEmail?: boolean;
  hasPhone?: boolean;
}

export interface TransactionSearchFilters {
  searchTerm?: string;
  type?: 'purchase' | 'payment' | 'return' | 'all';
  status?: 'pending' | 'completed' | 'cancelled' | 'all';
  supplier_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============= ANALYTICS TYPES =============
export interface SupplierAnalytics {
  supplier_id: string;
  supplier_name: string;
  total_purchases: number;
  total_amount: number;
  average_order_value: number;
  last_transaction_date?: string;
  transaction_count: number;
  status: 'active' | 'inactive';
}

export interface TransactionSummary {
  total_transactions: number;
  total_amount: number;
  pending_count: number;
  completed_count: number;
  cancelled_count: number;
  purchase_amount: number;
  payment_amount: number;
  return_amount: number;
}