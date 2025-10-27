import { BaseApiService, type SearchableFields } from '../core/BaseApiService';
import type { Client, CreateClientData } from './types';
import { withStoreId } from '../stores/storeHelpers';

export class ClientApiService extends BaseApiService<Client, CreateClientData> {
  constructor() {
    super('clients', '*');
  }

  // Override create to inject store_id
  async create(data: CreateClientData): Promise<Client> {
    const dataWithStore = await withStoreId(data);
    return super.create(dataWithStore);
  }

  async search(searchTerm: string): Promise<Client[]> {
    const searchFields = [
      'first_name', 
      'last_name', 
      'company_name', 
      'email', 
      'phone'
    ];
    
    return super.search(searchTerm, searchFields);
  }

  async getActiveClients(): Promise<Client[]> {
    return this.performQuery(
      this.supabase
        .from(this.tableName as any)
        .select(this.selectQuery)
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      'fetching active clients'
    );
  }
}