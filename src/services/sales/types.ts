export type Sale = {
  id: string;
  sale_number: string;
  client_id?: string;
  salesperson_id: string;
  status: string; // Changed from union type to string to match database
  payment_method: string; // Changed from union type to string to match database
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  sale_date: string;
  created_at?: string;
  updated_at?: string;
  client?: {
    id: string;
    type: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
  };
  salesperson?: {
    id: string;
    username?: string;
  };
  sale_items?: SaleItem[];
};

export type SaleItem = {
  id: string;
  sale_id?: string; // Made optional since it's not always needed when nested in Sale
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_number?: string;
  product?: {
    id: string;
    brand: string;
    model: string;
    year?: number;
  };
};

export type CreateSaleData = {
  client_id?: string;
  salesperson_id: string;
  status?: 'completed' | 'pending' | 'cancelled' | 'refunded';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'other';
  notes?: string;
  sale_items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    serial_number?: string;
  }[];
};