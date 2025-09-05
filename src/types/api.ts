/**
 * Comprehensive API type definitions with strict TypeScript
 */

export interface StrictBaseEntity {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at: string;
}

// Client types
export interface Client extends StrictBaseEntity {
  name: string;
  email: string;
  phone: string;
  address?: string;
  client_type: 'individual' | 'business';
  status: 'active' | 'inactive';
}

export interface CreateClientData {
  name: string;
  email: string;
  phone: string;
  address?: string;
  client_type: 'individual' | 'business';
  status?: 'active' | 'inactive';
}

// Product types
export interface Product extends StrictBaseEntity {
  brand: string;
  model: string;
  category_id: string;
  price: number;
  min_price: number;
  max_price: number;
  threshold: number;
  category?: Category;
  product_units?: ProductUnit[];
}

export interface CreateProductData {
  brand: string;
  model: string;
  category_id: string;
  price: number;
  min_price: number;
  max_price: number;
  threshold: number;
}

export interface Category extends StrictBaseEntity {
  name: string;
  description?: string;
}

export interface ProductUnit extends StrictBaseEntity {
  product_id: string;
  serial_number: string;
  imei?: string;
  ram?: string;
  storage?: string;
  color?: string;
  status: 'available' | 'sold' | 'reserved' | 'damaged';
}

export type CreateEntity<T> = Omit<T, keyof StrictBaseEntity>;

export type UpdateEntity<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryOptions {
  searchTerm?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, any>;
}

export interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export type SearchableFields<T> = Array<keyof T>;

export interface ServiceConfig {
  enableCache: boolean;
  enableToasts: boolean;
  queryConfig: 'realtime' | 'moderate' | 'static';
  optimistic: boolean;
  retryAttempts: number;
}

// Query Status Types
export type QueryStatus = 'idle' | 'loading' | 'error' | 'success';

export interface QueryState<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: ApiError | null;
  status: QueryStatus;
}

// Mutation Types
export interface MutationState<TData, TError = ApiError, TVariables = void> {
  data: TData | undefined;
  error: TError | null;
  isError: boolean;
  isIdle: boolean;
  isPending: boolean;
  isSuccess: boolean;
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

// Service Interface
export interface ApiServiceInterface<T extends StrictBaseEntity, TCreate = CreateEntity<T>> {
  getAll(options?: QueryOptions): Promise<T[]>;
  getById(id: string): Promise<T>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: UpdateEntity<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  search(searchTerm: string, fields: SearchableFields<T>): Promise<T[]>;
  count(filters?: Record<string, any>): Promise<number>;
  exists(id: string): Promise<boolean>;
}