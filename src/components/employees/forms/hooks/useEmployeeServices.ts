import { useMemo } from "react";
import { useEmployees } from "@/services/employees/EmployeesReactQueryService";

export function useEmployeeServices() {
  const { data: employees = [], isLoading, error, refetch } = useEmployees();

  const employeeStats = useMemo(() => {
    const employeesArray = Array.isArray(employees) ? employees : [];
    
    return {
      total: employeesArray.length,
      active: employeesArray.filter(emp => emp.status === 'active').length,
      inactive: employeesArray.filter(emp => emp.status === 'inactive').length,
      terminated: employeesArray.filter(emp => emp.status === 'terminated').length,
      departments: [...new Set(employeesArray.map(emp => emp.department).filter(Boolean))].length,
      averageSalary: employeesArray.length > 0 
        ? employeesArray
            .filter(emp => emp.salary && emp.salary > 0)
            .reduce((sum, emp) => sum + (emp.salary || 0), 0) / employeesArray.length
        : 0
    };
  }, [employees]);

  const filterEmployees = useMemo(() => ({
    byStatus: (status: string) => {
      const employeesArray = Array.isArray(employees) ? employees : [];
      return employeesArray.filter(emp => emp.status === status);
    },
    byDepartment: (department: string) => {
      const employeesArray = Array.isArray(employees) ? employees : [];
      return employeesArray.filter(emp => emp.department === department);
    },
    byRole: (role: string) => {
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
    }
  }), [employees]);

  return {
    employees: Array.isArray(employees) ? employees : [],
    employeeStats,
    filterEmployees,
    isLoading,
    error,
    refetch
  };
}