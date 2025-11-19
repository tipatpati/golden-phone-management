import { createCRUDMutations } from '../core/UnifiedCRUDService';
import { ClientApiService } from './ClientApiService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { QUERY_KEYS } from '../core/QueryKeys';
import { EVENT_TYPES } from '../core/EventBus';
import type { Client, CreateClientData } from './types';

const apiService = new ClientApiService();

// Create CRUD mutations using unified service
const clientCRUD = createCRUDMutations<Client, CreateClientData>(
  {
    entityName: 'client',
    queryKey: QUERY_KEYS.clients.all[0],
    eventTypes: {
      created: EVENT_TYPES.CLIENT_CREATED,
      updated: EVENT_TYPES.CLIENT_UPDATED,
      deleted: EVENT_TYPES.CLIENT_DELETED
    },
    relatedQueries: [QUERY_KEYS.sales.all[0]]
  },
  {
    create: (data) => apiService.create(data),
    update: (id, data) => apiService.update(id, data),
    delete: (id) => apiService.delete(id)
  }
);

// Export hooks for use in components
export const useClients = (searchTerm: string = '') => 
  useOptimizedQuery(
    searchTerm ? [...QUERY_KEYS.clients.all, 'search', searchTerm] : QUERY_KEYS.clients.all,
    () => searchTerm ? apiService.search(searchTerm) : apiService.getAll(),
    'moderate'
  );

export const useClient = (id: string) => 
  useOptimizedQuery(
    QUERY_KEYS.clients.detail(id),
    () => apiService.getById(id),
    'moderate'
  );

export const useActiveClients = () => 
  useOptimizedQuery(
    QUERY_KEYS.clients.active(),
    () => apiService.getActiveClients(),
    'moderate'
  );

export const useCreateClient = clientCRUD.useCreate;
export const useUpdateClient = clientCRUD.useUpdate;
export const useDeleteClient = clientCRUD.useDelete;

export type { Client, CreateClientData };