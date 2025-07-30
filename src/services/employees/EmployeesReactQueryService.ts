import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { EmployeesApiService } from './EmployeesApiService';
import type { Employee, CreateEmployeeData } from './types';

class EmployeesReactQueryServiceClass extends BaseReactQueryService<Employee, CreateEmployeeData> {
  constructor() {
    const apiService = new EmployeesApiService();
    super(apiService, 'employees', { queryConfig: 'moderate' });
  }

  protected getSearchFields(): string[] {
    return ['first_name', 'last_name', 'email', 'phone', 'employee_id'];
  }
}

export const employeesService = new EmployeesReactQueryServiceClass();

// Export hooks for use in components
export const useEmployees = () => 
  employeesService.useGetAll();

export const useEmployee = (id: string) => 
  employeesService.useGetById(id);

export const useCreateEmployee = () => 
  employeesService.useCreate();

export const useUpdateEmployee = () => 
  employeesService.useUpdate();

export const useDeleteEmployee = () => 
  employeesService.useDelete();

export type { Employee, CreateEmployeeData };