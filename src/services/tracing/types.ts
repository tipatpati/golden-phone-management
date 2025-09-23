export interface ProductTraceResult {
  // Product basic info
  productInfo: {
    id: string;
    brand: string;
    model: string;
    category?: string;
    barcode?: string;
    description?: string;
  };
  
  // Unit details
  unitDetails: {
    id: string;
    serial_number: string;
    barcode?: string;
    color?: string;
    storage?: number;
    ram?: number;
    battery_level?: number;
    condition: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  
  // Acquisition history
  acquisitionHistory?: {
    supplier_id?: string;
    supplier_name?: string;
    supplier_contact?: string;
    supplier_email?: string;
    supplier_phone?: string;
    transaction_id?: string;
    transaction_number?: string;
    transaction_type?: string;
    transaction_date?: string;
    transaction_status?: string;
    unit_cost?: number;
    total_cost?: number;
    quantity?: number;
    purchase_price?: number;
    purchase_date?: string;
    notes?: string;
    transaction_items?: Array<{
      id: string;
      product_id: string;
      quantity: number;
      unit_cost: number;
      total_cost: number;
      product_details: {
        brand: string;
        model: string;
        category?: string;
        description?: string;
        barcode?: string;
        storage?: number;
        ram?: number;
        color?: string;
        has_serial: boolean;
      };
      unit_details?: Array<{
        serial_number?: string;
        barcode?: string;
        color?: string;
        storage?: number;
        ram?: number;
        condition?: string;
        status?: string;
      }>;
    }>;
  };
  
  // Modification history
  modificationHistory: Array<{
    id: string;
    operation_type: string;
    changed_at: string;
    changed_by?: string;
    old_data?: any;
    new_data?: any;
    note?: string;
  }>;
  
  // Sale information (if sold)
  saleInfo?: {
    sale_id: string;
    sale_number: string;
    sold_price: number;
    sold_at: string;
    customer_name?: string;
    customer_type?: string;
    customer_email?: string;
    customer_phone?: string;
    salesperson_name?: string;
    payment_method?: string;
    payment_type?: string;
    subtotal?: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount?: number;
    notes?: string;
    sale_items?: Array<{
      id: string;
      product_id: string;
      serial_number?: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      product_details: {
        brand: string;
        model: string;
        category?: string;
        description?: string;
        barcode?: string;
        storage?: number;
        ram?: number;
        color?: string;
        has_serial: boolean;
      };
    }>;
  };
  
  // Current status
  currentStatus: 'available' | 'sold' | 'damaged' | 'repair' | 'reserved';
}

export interface TraceSearchParams {
  serialNumber: string;
}

export interface TraceTimelineEvent {
  id: string;
  type: 'acquisition' | 'modification' | 'sale';
  date: string;
  title: string;
  description: string;
  icon: string;
  data?: any;
}