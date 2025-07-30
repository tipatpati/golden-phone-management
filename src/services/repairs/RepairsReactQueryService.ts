import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { RepairsApiService } from './RepairsApiService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import type { Repair, CreateRepairData } from './types';

class RepairsReactQueryServiceClass extends BaseReactQueryService<Repair, CreateRepairData> {
  constructor() {
    const apiService = new RepairsApiService();
    super(apiService, 'repairs', { queryConfig: 'moderate' });
  }

  protected getSearchFields(): string[] {
    return ['repair_number', 'device', 'issue', 'imei'];
  }

  useTechnicians() {
    return useOptimizedQuery(
      ['technicians'],
      () => (this.apiService as RepairsApiService).getTechnicians(),
      'static'
    );
  }
}

export const repairsService = new RepairsReactQueryServiceClass();

// Export hooks for use in components
export const useRepairs = (searchTerm: string = '') => 
  repairsService.useGetAll(searchTerm);

export const useRepair = (id: string) => 
  repairsService.useGetById(id);

export const useCreateRepair = () => 
  repairsService.useCreate();

export const useUpdateRepair = () => 
  repairsService.useUpdate();

export const useDeleteRepair = () => 
  repairsService.useDelete();

export const useTechnicians = () => 
  repairsService.useTechnicians();

export type { Repair, CreateRepairData };