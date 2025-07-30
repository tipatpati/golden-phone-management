import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

export interface BaseEntity {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchFilters {
  searchTerm?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
}

export type SearchableFields<T> = Array<keyof T>;

export interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count?: number;
  totalPages?: number;
  currentPage?: number;
}

export abstract class BaseApiService<T extends BaseEntity, TCreate = Omit<T, keyof BaseEntity>> {
  constructor(
    protected tableName: string,
    protected selectQuery: string = '*'
  ) {}

  protected get supabase() {
    return supabase;
  }

  protected handleError(operation: string, error: PostgrestError): never {
    const apiError: ApiError = new Error(error.message || `Failed to ${operation} ${this.tableName}`) as ApiError;
    apiError.code = error.code;
    apiError.status = 400; // Default status
    apiError.details = error.details ? { details: error.details } : {};
    
    console.error(`Error ${operation} ${this.tableName}:`, apiError);
    throw apiError;
  }

  protected buildSearchQuery(searchTerm: string, searchFields: string[]) {
    return searchFields
      .map(field => `${field}.ilike.%${searchTerm}%`)
      .join(',');
  }

  protected async performQuery<TResult = T>(
    queryBuilder: any,
    operation: string
  ): Promise<TResult> {
    const { data, error } = await queryBuilder;
    
    if (error) {
      this.handleError(operation, error);
    }
    
    return data;
  }

  async getAll(filters: SearchFilters = {}): Promise<T[]> {
    console.log(`Fetching ${this.tableName}...`);
    
    let query = this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery);
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }
    
    const orderBy = filters.orderBy || 'created_at';
    query = query.order(orderBy, { ascending: filters.ascending || false });
    
    return this.performQuery(query, 'fetching');
  }

  async getById(id: string): Promise<T> {
    console.log(`Fetching ${this.tableName} by id:`, id);
    
    const query = this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .eq('id', id)
      .maybeSingle();
    
    const result = await this.performQuery(query, 'fetching by id');
    
    if (!result) {
      throw new Error(`${this.tableName} with id ${id} not found`);
    }
    
    return result;
  }

  async create(data: TCreate): Promise<T> {
    console.log(`Creating ${this.tableName}:`, data);
    
    const query = this.supabase
      .from(this.tableName as any)
      .insert([data as any])
      .select(this.selectQuery)
      .maybeSingle();
    
    const result = await this.performQuery(query, 'creating');
    
    if (!result) {
      throw new Error(`Failed to create ${this.tableName}: No data returned`);
    }
    
    console.log(`${this.tableName} created successfully:`, result);
    return result;
  }

  async update(id: string, data: Partial<TCreate>): Promise<T> {
    console.log(`Updating ${this.tableName}:`, id, data);
    
    const query = this.supabase
      .from(this.tableName as any)
      .update(data as any)
      .eq('id', id)
      .select(this.selectQuery)
      .maybeSingle();
    
    const result = await this.performQuery(query, 'updating');
    
    if (!result) {
      throw new Error(`Failed to update ${this.tableName} with id ${id}: No data returned`);
    }
    
    console.log(`${this.tableName} updated successfully:`, result);
    return result;
  }

  async delete(id: string): Promise<boolean> {
    console.log(`Deleting ${this.tableName}:`, id);
    
    const query = this.supabase
      .from(this.tableName as any)
      .delete()
      .eq('id', id);
    
    await this.performQuery(query, 'deleting');
    console.log(`${this.tableName} deleted successfully`);
    return true;
  }

  async search(searchTerm: string, searchFields: string[]): Promise<T[]> {
    if (!searchTerm) return this.getAll();
    
    console.log(`Searching ${this.tableName} with term:`, searchTerm);
    const searchFieldStrings = searchFields;
    const query = this.supabase
      .from(this.tableName as any)
      .select(this.selectQuery)
      .or(this.buildSearchQuery(searchTerm, searchFieldStrings))
      .order('created_at', { ascending: false });
    
    return this.performQuery(query, 'searching');
  }

  async count(filters?: Record<string, any>): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName as any)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      this.handleError('counting', error);
    }
    
    return count || 0;
  }

  async exists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName as any)
      .select('id')
      .eq('id', id)
      .limit(1);
    
    if (error) {
      this.handleError('checking existence', error);
    }
    
    return data && data.length > 0;
  }
}