import type { BaseEntity } from '../core/BaseApiService';

export interface Brand extends BaseEntity {
  name: string;
  category_id?: number;
  logo_url?: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface Model extends BaseEntity {
  brand_id: string;
  name: string;
  category_id?: number;
  storage_variants: string[];
  color_variants: string[];
  release_year?: number;
  brand?: {
    id: string;
    name: string;
  };
  category?: {
    id: number;
    name: string;
  };
}

export type CreateBrandData = Omit<Brand, keyof BaseEntity | 'category'>;
export type CreateModelData = Omit<Model, keyof BaseEntity | 'brand' | 'category'>;