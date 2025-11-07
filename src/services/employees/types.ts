import type { BaseEntity } from '../core/BaseApiService';

export interface Employee extends BaseEntity {
  employee_id?: string;
  profile_id: string; // Now required - every employee must have a profile
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  salary?: number;
  status: 'active' | 'inactive' | 'terminated';
  notes?: string;
  store_id?: string; // Store assignment
  profiles?: {
    role: string;
    username: string;
    is_system_user?: boolean; // Added to distinguish system users from employees
  };
}

export type CreateEmployeeData = Omit<Employee, keyof BaseEntity | 'profiles'>;