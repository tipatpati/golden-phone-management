import { createCRUDMutations } from '../core/UnifiedCRUDService';
import { RepairsApiService } from './RepairsApiService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { QUERY_KEYS } from '../core/QueryKeys';
import { EVENT_TYPES } from '../core/EventBus';
import type { Repair, CreateRepairData } from './types';

const apiService = new RepairsApiService();

// Create CRUD mutations using unified service
const repairCRUD = createCRUDMutations<Repair, CreateRepairData>(
  {
    entityName: 'repair',
    queryKey: QUERY_KEYS.repairs.all[0],
    eventTypes: {
      created: EVENT_TYPES.REPAIR_CREATED,
      updated: EVENT_TYPES.REPAIR_UPDATED,
      deleted: EVENT_TYPES.REPAIR_DELETED
    },
    relatedQueries: [QUERY_KEYS.inventory.all[0], QUERY_KEYS.clients.all[0]]
  },
  {
    create: (data) => apiService.create(data),
    update: (id, data) => apiService.update(id, data),
    delete: (id) => apiService.delete(id)
  }
);

// Export hooks for use in components
export const useRepairs = (searchTerm: string = '') => 
  useOptimizedQuery(
    searchTerm ? [...QUERY_KEYS.repairs.all, 'search', searchTerm] : QUERY_KEYS.repairs.all,
    () => searchTerm ? apiService.search(searchTerm) : apiService.getAll(),
    'moderate'
  );

export const useRepair = (id: string) => 
  useOptimizedQuery(
    QUERY_KEYS.repairs.detail(id),
    () => apiService.getById(id),
    'moderate'
  );

export const useTechnicians = () => 
  useOptimizedQuery(
    QUERY_KEYS.technicians,
    () => apiService.getTechnicians(),
    'static'
  );

export const useCreateRepair = repairCRUD.useCreate;
export const useUpdateRepair = repairCRUD.useUpdate;
export const useDeleteRepair = repairCRUD.useDelete;

export type { Repair, CreateRepairData };