import type { BaseEntity } from '../core/BaseApiService';

export interface Employee extends BaseEntity {
  employee_id?: string;
  profile_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  hire_date?: string;
  salary?: number;
  status: 'active' | 'inactive';
  notes?: string;
  profiles?: {
    role: string;
    username: string;
  };
}

export type CreateEmployeeData = Omit<Employee, keyof BaseEntity | 'profiles'>;