import { useOptimizedService } from '../core/OptimizedService';
import { useMemo } from 'react';
import { EmployeesApiService } from './EmployeesApiService';
import type { Employee, CreateEmployeeData } from './types';

// Optimized employee service with enhanced caching and performance
const employeeApiService = new EmployeesApiService();

export const useOptimizedEmployeeService = () => {
  // Create a wrapper to match the expected interface
  const wrappedService = {
    getAll: () => employeeApiService.getAll(),
    getById: (id: string) => employeeApiService.getById(id),
    create: (data: CreateEmployeeData) => employeeApiService.create(data),
    update: (id: string, data: Partial<CreateEmployeeData>) => employeeApiService.update(id, data),
    delete: async (id: string): Promise<void> => {
      await employeeApiService.delete(id);
    }
  };

  return useOptimizedService<Employee, CreateEmployeeData, Partial<CreateEmployeeData>>(
    {
      queryKey: 'employees',
      entityName: 'Employee',
      successMessages: {
        create: 'Dipendente creato con successo',
        update: 'Dipendente aggiornato con successo',
        delete: 'Dipendente eliminato con successo',
      }
    },
    wrappedService
  );
};

// Export individual hooks for easier migration
export const useOptimizedEmployees = () => {
  const service = useOptimizedEmployeeService();
  return service.useGetAll();
};

export const useOptimizedEmployee = (id: string) => {
  const service = useOptimizedEmployeeService();
  return service.useGetById(id);
};

export const useOptimizedCreateEmployee = () => {
  const service = useOptimizedEmployeeService();
  return service.useCreate();
};

export const useOptimizedUpdateEmployee = () => {
  const service = useOptimizedEmployeeService();
  return service.useUpdate();
};

export const useOptimizedDeleteEmployee = () => {
  const service = useOptimizedEmployeeService();
  return service.useDelete();
};

// Enhanced hooks with additional functionality
export function useEmployeeStatistics() {
  const { data: employees = [] } = useOptimizedEmployees();
  
  return useMemo(() => {
    const employeesArray = Array.isArray(employees) ? employees : [];
    
    return {
      total: employeesArray.length,
      active: employeesArray.filter(emp => emp.status === 'active').length,
      inactive: employeesArray.filter(emp => emp.status === 'inactive').length,
      terminated: employeesArray.filter(emp => emp.status === 'terminated').length,
      departments: [...new Set(employeesArray.map(emp => emp.department).filter(Boolean))],
      positions: [...new Set(employeesArray.map(emp => emp.position).filter(Boolean))],
      averageSalary: employeesArray.length > 0 
        ? employeesArray
            .filter(emp => emp.salary && emp.salary > 0)
            .reduce((sum, emp) => sum + (emp.salary || 0), 0) / employeesArray.length
        : 0,
      recentHires: employeesArray
        .filter(emp => {
          const hireDate = new Date(emp.hire_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return hireDate > thirtyDaysAgo;
        }).length
    };
  }, [employees]);
}

export function useEmployeeFilters() {
  const { data: employees = [] } = useOptimizedEmployees();
  
  return useMemo(() => ({
    filterByStatus: (status: string) => {
      const employeesArray = Array.isArray(employees) ? employees : [];
      return employeesArray.filter(emp => emp.status === status);
    },
    filterByDepartment: (department: string) => {
      const employeesArray = Array.isArray(employees) ? employees : [];
      return employeesArray.filter(emp => emp.department === department);
    },
    filterByRole: (role: string) => {
      const employeesArray = Array.isArray(employees) ? employees : [];
      return employeesArray.filter(emp => emp.profiles?.role === role);
    },
    search: (searchTerm: string) => {
      const employeesArray = Array.isArray(employees) ? employees : [];
      const term = searchTerm.toLowerCase();
      return employeesArray.filter(emp => 
        emp.first_name?.toLowerCase().includes(term) ||
        emp.last_name?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.phone?.toLowerCase().includes(term) ||
        emp.department?.toLowerCase().includes(term) ||
        emp.position?.toLowerCase().includes(term)
      );
    },
    sortBy: (field: keyof Employee, direction: 'asc' | 'desc' = 'asc') => {
      const employeesArray = Array.isArray(employees) ? employees : [];
      return [...employeesArray].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return direction === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }
  }), [employees]);
}