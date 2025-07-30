import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { ClientApiService } from './ClientApiService';
import type { Client, CreateClientData } from './types';

class ClientReactQueryServiceClass extends BaseReactQueryService<Client, CreateClientData> {
  constructor() {
    const apiService = new ClientApiService();
    super(apiService, 'clients', { queryConfig: 'moderate' });
  }

  protected getSearchFields(): string[] {
    return ['first_name', 'last_name', 'company_name', 'email', 'phone'];
  }

  useActiveClients() {
    return this.useGetAll('', {
      queryKey: ['clients', 'active'],
      queryFn: () => (this.apiService as ClientApiService).getActiveClients(),
    });
  }
}

export const clientService = new ClientReactQueryServiceClass();

// Export hooks for use in components
export const useClients = (searchTerm: string = '') => 
  clientService.useGetAll(searchTerm);

export const useClient = (id: string) => 
  clientService.useGetById(id);

export const useCreateClient = () => 
  clientService.useCreate();

export const useUpdateClient = () => 
  clientService.useUpdate();

export const useDeleteClient = () => 
  clientService.useDelete();

export const useActiveClients = () => 
  clientService.useActiveClients();

export type { Client, CreateClientData };