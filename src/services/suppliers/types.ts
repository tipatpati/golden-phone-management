import type { BaseEntity } from '../core/BaseApiService';

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