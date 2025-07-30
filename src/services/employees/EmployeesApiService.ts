import { BaseApiService } from '../core/BaseApiService';
import type { Employee, CreateEmployeeData } from './types';

export class EmployeesApiService extends BaseApiService<Employee, CreateEmployeeData> {
  constructor() {
    super('employees', `
      *,
      profiles:profile_id (
        role,
        username
      )
    `);
  }

  async search(searchTerm: string): Promise<Employee[]> {
    const searchFields = [
      'first_name', 
      'last_name', 
      'email', 
      'phone',
      'employee_id'
    ];
    
    return super.search(searchTerm, searchFields);
  }

  async getAll(): Promise<Employee[]> {
    return super.getAll({ orderBy: 'created_at', ascending: false });
  }
}