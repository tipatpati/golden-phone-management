import { createCRUDMutations } from '../core/UnifiedCRUDService';
import { EmployeesApiService } from './EmployeesApiService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { QUERY_KEYS } from '../core/QueryKeys';
import { EVENT_TYPES } from '../core/EventBus';
import type { Employee, CreateEmployeeData } from './types';

const apiService = new EmployeesApiService();

// Create CRUD mutations using unified service
const employeeCRUD = createCRUDMutations<Employee, CreateEmployeeData>(
  {
    entityName: 'employee',
    queryKey: QUERY_KEYS.employees.all[0],
    eventTypes: {
      created: EVENT_TYPES.EMPLOYEE_CREATED,
      updated: EVENT_TYPES.EMPLOYEE_UPDATED,
      deleted: EVENT_TYPES.EMPLOYEE_DELETED
    },
    relatedQueries: [QUERY_KEYS.employees.profiles.all[0]]
  },
  {
    create: (data) => apiService.create(data),
    update: (id, data) => apiService.update(id, data),
    delete: (id) => apiService.delete(id)
  }
);

// Export hooks for use in components
export const useEmployees = (searchTerm: string = '') => 
  useOptimizedQuery(
    searchTerm ? [...QUERY_KEYS.employees.all, 'search', searchTerm] : QUERY_KEYS.employees.all,
    () => searchTerm ? apiService.search(searchTerm) : apiService.getAll(),
    'moderate'
  );

export const useEmployee = (id: string) => 
  useOptimizedQuery(
    QUERY_KEYS.employees.detail(id),
    () => apiService.getById(id),
    'moderate'
  );

export const useCreateEmployee = employeeCRUD.useCreate;
export const useUpdateEmployee = employeeCRUD.useUpdate;
export const useDeleteEmployee = employeeCRUD.useDelete;

export type { Employee, CreateEmployeeData };