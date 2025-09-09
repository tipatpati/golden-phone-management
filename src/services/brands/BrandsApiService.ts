import { BaseApiService } from '../core/BaseApiService';
import type { Brand, Model, CreateBrandData, CreateModelData } from './types';

export class BrandsApiService extends BaseApiService<Brand, CreateBrandData> {
  constructor() {
    super('brands', `
      id,
      name,
      slug,
      category_id,
      logo_url,
      search_vector,
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
    if (!searchTerm.trim()) return [];
    
    // Use the new optimized search function
    const { data, error } = await this.supabase
      .rpc('search_brands', {
        search_term: searchTerm,
        max_results: 20
      });

    if (error) throw error;
    return data || [];
  }

  async searchBrandsBySlug(slug: string): Promise<Brand | null> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data ? this.transformData(data) : null;
  }

  async getBrandAliases(brandId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('brand_aliases')
      .select('alias')
      .eq('brand_id', brandId)
      .order('alias');

    if (error) throw error;
    return data?.map(item => item.alias) || [];
  }

  async addBrandAlias(brandId: string, alias: string): Promise<void> {
    const { error } = await this.supabase
      .from('brand_aliases')
      .insert({ brand_id: brandId, alias });

    if (error) throw error;
  }
}

export class ModelsApiService extends BaseApiService<Model, CreateModelData> {
  constructor() {
    super('models', `
      id,
      brand_id,
      name,
      slug,
      category_id,
      storage_variants,
      color_variants,
      release_year,
      search_vector,
      created_at,
      updated_at,
      brand:brands(id, name, slug),
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
    if (!searchTerm.trim()) return [];
    
    // Use the new optimized search function
    const { data, error } = await this.supabase
      .rpc('search_models', {
        search_term: searchTerm,
        brand_name: brandName || null,
        max_results: 20
      });

    if (error) throw error;
    return data || [];
  }

  async searchModelsBySlug(brandSlug: string, modelSlug: string): Promise<Model | null> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .eq('slug', modelSlug)
      .eq('brands.slug', brandSlug);

    if (error) throw error;
    return data ? this.transformData(data) : null;
  }

  async getModelAliases(modelId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('model_aliases')
      .select('alias')
      .eq('model_id', modelId)
      .order('alias');

    if (error) throw error;
    return data?.map(item => item.alias) || [];
  }

  async addModelAlias(modelId: string, brandId: string, alias: string): Promise<void> {
    const { error } = await this.supabase
      .from('model_aliases')
      .insert({ model_id: modelId, brand_id: brandId, alias });

    if (error) throw error;
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