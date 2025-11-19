import { createCRUDMutations } from '../core/UnifiedCRUDService';
import { SuppliersApiService } from './SuppliersApiService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { QUERY_KEYS } from '../core/QueryKeys';
import { EVENT_TYPES } from '../core/EventBus';
import type { Supplier, CreateSupplierData } from './types';

const apiService = new SuppliersApiService();

// Create CRUD mutations using unified service
const supplierCRUD = createCRUDMutations<Supplier, CreateSupplierData>(
  {
    entityName: 'supplier',
    queryKey: QUERY_KEYS.suppliers.all[0],
    eventTypes: {
      created: EVENT_TYPES.SUPPLIER_CREATED,
      updated: EVENT_TYPES.SUPPLIER_UPDATED,
      deleted: EVENT_TYPES.SUPPLIER_DELETED
    },
    relatedQueries: [QUERY_KEYS.suppliers.transactions.all[0]]
  },
  {
    create: (data) => apiService.create(data),
    update: (id, data) => apiService.update(id, data),
    delete: (id) => apiService.delete(id)
  }
);

// Export hooks for use in components
export const useSuppliers = (searchTerm: string = '') => 
  useOptimizedQuery(
    searchTerm ? [...QUERY_KEYS.suppliers.all, 'search', searchTerm] : QUERY_KEYS.suppliers.all,
    () => searchTerm ? apiService.search(searchTerm) : apiService.getAll(),
    'moderate'
  );

export const useSupplier = (id: string) => 
  useOptimizedQuery(
    QUERY_KEYS.suppliers.detail(id),
    () => apiService.getById(id),
    'moderate'
  );

export const useCreateSupplier = supplierCRUD.useCreate;
export const useUpdateSupplier = supplierCRUD.useUpdate;
export const useDeleteSupplier = supplierCRUD.useDelete;

export type { Supplier, CreateSupplierData };