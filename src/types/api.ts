/**
 * Enhanced TypeScript types for API services
 */

export interface StrictBaseEntity {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at: string;
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