// Store and multi-tenant types

export interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateStoreData {
  name: string;
  code: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateStoreData extends Partial<CreateStoreData> {
  id: string;
}

export interface UserStore {
  id: string;
  user_id: string;
  store_id: string;
  is_default: boolean;
  created_at: string;
  store?: Store; // Populated when joined
}

export interface AssignUserToStoreData {
  user_id: string;
  store_id: string;
  is_default?: boolean;
}

export interface StoreStats {
  store_id: string;
  total_sales: number;
  total_revenue: number;
  total_products: number;
  total_clients: number;
  total_repairs: number;
  active_employees: number;
}
