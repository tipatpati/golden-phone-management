import type { BaseEntity } from '../core/BaseApiService';

export interface Client extends BaseEntity {
  type: 'individual' | 'business';
  first_name?: string;
  last_name?: string;
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
  status: 'active' | 'inactive';
}

export type CreateClientData = Omit<Client, keyof BaseEntity>;