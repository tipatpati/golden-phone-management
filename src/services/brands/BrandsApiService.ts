import { BaseApiService } from '../core/BaseApiService';
import type { Brand, Model, CreateBrandData, CreateModelData } from './types';

export class BrandsApiService extends BaseApiService<Brand, CreateBrandData> {
  constructor() {
    super('brands', `
      id,
      name,
      category_id,
      logo_url,
      created_at,
      updated_at,
      category:categories(id, name)
    `);
  }

  protected transformData(brand: any): Brand {
    return {
      ...brand,
      category_name: brand.category?.name
    };
  }

  async getAll(filters = {}): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .order('name');

    if (error) throw error;
    return data?.map(item => this.transformData(item)) || [];
  }

  async getByCategory(categoryId: number): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .eq('category_id', categoryId)
      .order('name');

    if (error) throw error;
    return data?.map(item => this.transformData(item)) || [];
  }

  async searchBrands(searchTerm: string): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .ilike('name', `%${searchTerm}%`)
      .order('name')
      .limit(10);

    if (error) throw error;
    return data?.map(item => this.transformData(item)) || [];
  }
}

export class ModelsApiService extends BaseApiService<Model, CreateModelData> {
  constructor() {
    super('models', `
      id,
      brand_id,
      name,
      category_id,
      storage_variants,
      color_variants,
      release_year,
      created_at,
      updated_at,
      brand:brands(id, name),
      category:categories(id, name)
    `);
  }

  protected transformData(model: any): Model {
    return {
      ...model,
      storage_variants: model.storage_variants || [],
      color_variants: model.color_variants || []
    };
  }

  async getAll(filters = {}): Promise<Model[]> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .order('name');

    if (error) throw error;
    return data?.map(item => this.transformData(item)) || [];
  }

  async getByBrand(brandId: string): Promise<Model[]> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .eq('brand_id', brandId)
      .order('name');

    if (error) throw error;
    return data?.map(item => this.transformData(item)) || [];
  }

  async getByBrandName(brandName: string): Promise<Model[]> {
    // First get the brand ID
    const { data: brands, error: brandError } = await this.supabase
      .from('brands' as any)
      .select('id')
      .ilike('name', `%${brandName}%`)
      .limit(1);

    if (brandError || !brands || brands.length === 0) {
      return [];
    }

    const brandId = (brands[0] as any).id;
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .eq('brand_id', brandId)
      .order('name');

    if (error) throw error;
    return data?.map(item => this.transformData(item)) || [];
  }

  async searchModels(searchTerm: string, brandName?: string): Promise<Model[]> {
    let query = this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .ilike('name', `%${searchTerm}%`);

    if (brandName) {
      // First get the brand ID
      const { data: brands, error: brandError } = await this.supabase
        .from('brands' as any)
        .select('id')
        .ilike('name', `%${brandName}%`)
        .limit(1);

      if (!brandError && brands && brands.length > 0) {
        const brandId = (brands[0] as any).id;
        query = query.eq('brand_id', brandId);
      }
    }

    const { data, error } = await query
      .order('name')
      .limit(10);

    if (error) throw error;
    return data?.map(item => this.transformData(item)) || [];
  }

  async getByCategory(categoryId: number): Promise<Model[]> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .eq('category_id', categoryId)
      .order('name');

    if (error) throw error;
    return data?.map(item => this.transformData(item)) || [];
  }
}