import { BaseApiService } from '../core/BaseApiService';
import type { Supplier, CreateSupplierData } from './types';

export class SuppliersApiService extends BaseApiService<Supplier, CreateSupplierData> {
  constructor() {
    super('suppliers', '*');
  }

  async search(searchTerm: string): Promise<Supplier[]> {
    const searchFields = [
      'name', 
      'contact_person', 
      'email', 
      'phone'
    ];
    
    return super.search(searchTerm, searchFields);
  }

  async getAll(): Promise<Supplier[]> {
    return super.getAll({ orderBy: 'name', ascending: true });
  }
}