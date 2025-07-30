/**
 * Comprehensive type definitions for the application
 * Replaces loose typing with strict interfaces
 */

// Base types
export type ID = string;
export type Timestamp = string; // ISO string
export type Currency = number;

// User and Authentication
export interface User {
  id: ID;
  email: string;
  username?: string;
  role: 'admin' | 'manager' | 'inventory_manager' | 'salesperson' | 'technician';
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface AuthSession {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// Product Management
export interface Product {
  id: ID;
  brand: string;
  model: string;
  description?: string;
  price: Currency;
  min_price?: Currency;
  max_price?: Currency;
  stock: number;
  threshold: number;
  category_id?: number;
  year?: number;
  battery_level?: number;
  has_serial: boolean;
  serial_numbers?: string[];
  barcode?: string;
  supplier?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateProductRequest {
  brand: string;
  model: string;
  description?: string;
  price: Currency;
  min_price?: Currency;
  max_price?: Currency;
  stock: number;
  threshold: number;
  category_id?: number;
  year?: number;
  battery_level?: number;
  has_serial: boolean;
  serial_numbers?: string[];
  barcode?: string;
  supplier?: string;
}

export interface SerialEntry {
  serial: string;
  batteryLevel?: number;
  color?: string;
}

// Client Management
export type ClientType = 'individual' | 'business';
export type ClientStatus = 'active' | 'inactive';

export interface Client {
  id: ID;
  type: ClientType;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  status: ClientStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CreateClientRequest {
  type: ClientType;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  status?: ClientStatus;
}

// Sales Management
export type SaleStatus = 'completed' | 'pending' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'check' | 'other';

export interface Sale {
  id: ID;
  sale_number: string;
  client_id?: ID;
  salesperson_id: ID;
  subtotal: Currency;
  tax_amount: Currency;
  total_amount: Currency;
  sale_date: Timestamp;
  status: SaleStatus;
  payment_method: PaymentMethod;
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  // Relations
  client?: Client;
  salesperson?: User;
  items?: SaleItem[];
}

export interface SaleItem {
  id: ID;
  sale_id: ID;
  product_id: ID;
  quantity: number;
  unit_price: Currency;
  total_price: Currency;
  serial_number?: string;
  created_at: Timestamp;
  // Relations
  product?: Product;
}

export interface CreateSaleRequest {
  client_id?: ID;
  payment_method: PaymentMethod;
  notes?: string;
  items: CreateSaleItemRequest[];
}

export interface CreateSaleItemRequest {
  product_id: ID;
  quantity: number;
  unit_price: Currency;
  serial_number?: string;
}

// Repair Management
export type RepairStatus = 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled' | 'delivered';
export type RepairPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Repair {
  id: ID;
  repair_number: string;
  client_id?: ID;
  technician_id?: ID;
  device: string;
  imei?: string;
  issue: string;
  status: RepairStatus;
  priority: RepairPriority;
  cost: Currency;
  parts_cost: Currency;
  labor_cost: Currency;
  estimated_completion_date?: Timestamp;
  actual_completion_date?: Timestamp;
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  // Relations
  client?: Client;
  technician?: User;
  parts?: RepairPart[];
}

export interface RepairPart {
  id: ID;
  repair_id: ID;
  product_id: ID;
  quantity: number;
  unit_cost: Currency;
  total_cost: Currency;
  created_at: Timestamp;
  // Relations
  product?: Product;
}

// Form State Management
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isLoading: boolean;
  isDirty: boolean;
  isValid: boolean;
}

export interface FormActions<T> {
  updateField: (field: keyof T, value: any) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  reset: () => void;
  validate: () => boolean;
}

// API Response Types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Query and Filter Types
export interface QueryFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Component Props Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

// User role type - inline definition to avoid circular dependency
export type UserRole = 'admin' | 'manager' | 'inventory_manager' | 'salesperson' | 'technician';

// Re-export the User type with proper role type
export interface UserWithRole extends Omit<User, 'role'> {
  role: UserRole;
}