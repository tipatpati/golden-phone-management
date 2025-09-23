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
    salesperson_name?: string;
    payment_method?: string;
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