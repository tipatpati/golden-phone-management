import { createCRUDMutations } from '../core/UnifiedCRUDService';
import { BrandsApiService, ModelsApiService } from './BrandsApiService';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import { QUERY_KEYS } from '../core/QueryKeys';
import { EVENT_TYPES } from '../core/EventBus';
import type { Brand, Model, CreateBrandData, CreateModelData } from './types';

const brandsApiService = new BrandsApiService();
const modelsApiService = new ModelsApiService();

// Create CRUD mutations for brands
const brandCRUD = createCRUDMutations<Brand, CreateBrandData>(
  {
    entityName: 'brand',
    queryKey: QUERY_KEYS.brands.all[0],
    eventTypes: {
      created: EVENT_TYPES.BRAND_CREATED,
      updated: EVENT_TYPES.BRAND_UPDATED,
      deleted: EVENT_TYPES.BRAND_DELETED
    },
    relatedQueries: [QUERY_KEYS.models.all[0], QUERY_KEYS.inventory.all[0]]
  },
  {
    create: (data) => brandsApiService.create(data),
    update: (id, data) => brandsApiService.update(id, data),
    delete: (id) => brandsApiService.delete(id)
  }
);

// Brand hooks
export const useBrands = () => 
  useOptimizedQuery(
    QUERY_KEYS.brands.all,
    () => brandsApiService.getAll(),
    'static'
  );

export const useBrand = (id: string) => 
  useOptimizedQuery(
    QUERY_KEYS.brands.detail(id),
    () => brandsApiService.getById(id),
    'static'
  );

export const useBrandsByCategory = (categoryId: number) => 
  useOptimizedQuery(
    QUERY_KEYS.brands.byCategory(categoryId),
    () => brandsApiService.getByCategory(categoryId),
    'static'
  );

export const useSearchBrands = (searchTerm: string) => 
  useOptimizedQuery(
    QUERY_KEYS.brands.search(searchTerm),
    () => brandsApiService.searchBrands(searchTerm),
    'static'
  );

export const useCreateBrand = brandCRUD.useCreate;
export const useUpdateBrand = brandCRUD.useUpdate;
export const useDeleteBrand = brandCRUD.useDelete;

// Model hooks
export const useModels = () => 
  useOptimizedQuery(
    QUERY_KEYS.models.all,
    () => modelsApiService.getAll(),
    'static'
  );

export const useModelsByBrand = (brandName: string) => 
  useOptimizedQuery(
    QUERY_KEYS.models.byBrand(brandName),
    () => modelsApiService.getByBrandName(brandName),
    'static'
  );

export const useSearchModels = (searchTerm: string, brandName?: string) => 
  useOptimizedQuery(
    QUERY_KEYS.models.search(searchTerm, brandName),
    () => modelsApiService.searchModels(searchTerm, brandName),
    'static'
  );

export const useModelsByCategory = (categoryId: number) => 
  useOptimizedQuery(
    QUERY_KEYS.models.byCategory(categoryId),
    () => modelsApiService.getByCategory(categoryId),
    'static'
  );

export type { Brand, Model, CreateBrandData, CreateModelData };