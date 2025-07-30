import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { SuppliersApiService } from './SuppliersApiService';
import type { Supplier, CreateSupplierData } from './types';

class SuppliersReactQueryServiceClass extends BaseReactQueryService<Supplier, CreateSupplierData> {
  constructor() {
    const apiService = new SuppliersApiService();
    super(apiService, 'suppliers', { queryConfig: 'moderate' });
  }

  protected getSearchFields(): string[] {
    return ['name', 'contact_person', 'email', 'phone'];
  }
}

export const suppliersService = new SuppliersReactQueryServiceClass();

// Export hooks for use in components
export const useSuppliers = () => 
  suppliersService.useGetAll();

export const useSupplier = (id: string) => 
  suppliersService.useGetById(id);

export const useCreateSupplier = () => 
  suppliersService.useCreate();

export const useUpdateSupplier = () => 
  suppliersService.useUpdate();

export const useDeleteSupplier = () => 
  suppliersService.useDelete();

export type { Supplier, CreateSupplierData };