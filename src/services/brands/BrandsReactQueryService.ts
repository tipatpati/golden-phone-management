import { BaseReactQueryService } from '../core/BaseReactQueryService';
import { BrandsApiService, ModelsApiService } from './BrandsApiService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import type { Brand, Model, CreateBrandData, CreateModelData } from './types';

class BrandsReactQueryServiceClass extends BaseReactQueryService<Brand, CreateBrandData> {
  private modelsApiService: ModelsApiService;

  constructor() {
    const apiService = new BrandsApiService();
    super(apiService, 'brands', { queryConfig: 'static' });
    this.modelsApiService = new ModelsApiService();
  }

  protected getSearchFields(): string[] {
    return ['name'];
  }

  useBrandsByCategory(categoryId: number) {
    return useOptimizedQuery(
      ['brands', 'category', categoryId.toString()],
      () => (this.apiService as BrandsApiService).getByCategory(categoryId),
      'static'
    );
  }

  useSearchBrands(searchTerm: string) {
    return useOptimizedQuery(
      ['brands', 'search', searchTerm],
      () => (this.apiService as BrandsApiService).searchBrands(searchTerm),
      'static'
    );
  }

  useModels() {
    return useOptimizedQuery(
      ['models'],
      () => this.modelsApiService.getAll(),
      'static'
    );
  }

  useModelsByBrand(brandName: string) {
    return useOptimizedQuery(
      ['models', 'brand', brandName],
      () => this.modelsApiService.getByBrandName(brandName),
      'static'
    );
  }

  useSearchModels(searchTerm: string, brandName?: string) {
    return useOptimizedQuery(
      ['models', 'search', searchTerm, brandName],
      () => this.modelsApiService.searchModels(searchTerm, brandName),
      'static'
    );
  }

  useModelsByCategory(categoryId: number) {
    return useOptimizedQuery(
      ['models', 'category', categoryId.toString()],
      () => this.modelsApiService.getByCategory(categoryId),
      'static'
    );
  }
}

export const brandsService = new BrandsReactQueryServiceClass();

// Export hooks for use in components
export const useBrands = () => brandsService.useGetAll();
export const useBrand = (id: string) => brandsService.useGetById(id);
export const useBrandsByCategory = (categoryId: number) => brandsService.useBrandsByCategory(categoryId);
export const useSearchBrands = (searchTerm: string) => brandsService.useSearchBrands(searchTerm);

export const useModels = () => brandsService.useModels();
export const useModelsByBrand = (brandName: string) => brandsService.useModelsByBrand(brandName);
export const useSearchModels = (searchTerm: string, brandName?: string) => brandsService.useSearchModels(searchTerm, brandName);
export const useModelsByCategory = (categoryId: number) => brandsService.useModelsByCategory(categoryId);

export type { Brand, Model, CreateBrandData, CreateModelData };