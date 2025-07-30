import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';
import type { BaseEntity, ApiError, SearchableFields } from './BaseApiService';

export interface BaseReactQueryOptions {
  enableToasts?: boolean;
  queryConfig?: 'realtime' | 'moderate' | 'static';
  optimistic?: boolean;
}

export class BaseReactQueryService<
  T extends BaseEntity, 
  TCreate = Omit<T, keyof BaseEntity>
> {
  constructor(
    protected apiService: any,
    protected queryKey: string,
    protected options: BaseReactQueryOptions = {}
  ) {
    this.options = {
      enableToasts: true,
      queryConfig: 'moderate',
      optimistic: false,
      ...options
    };
  }

  // Read operations
  useGetAll(searchTerm: string = '', customOptions?: UseQueryOptions) {
    return useOptimizedQuery(
      [this.queryKey, 'list', searchTerm],
      () => this.apiService.search ? 
        this.apiService.search(searchTerm, this.getSearchFields()) : 
        this.apiService.getAll({ searchTerm }),
      this.options.queryConfig
    );
  }

  useGetById(id: string, customOptions?: UseQueryOptions) {
    return useQuery({
      queryKey: [this.queryKey, 'detail', id],
      queryFn: async () => {
        try {
          return await this.apiService.getById(id);
        } catch (error) {
          console.warn(`${this.queryKey} with id ${id} not found:`, error);
          return null;
        }
      },
      enabled: !!id,
      ...customOptions,
    });
  }

  useSearch(searchTerm: string, searchFields: string[] = []) {
    return useOptimizedQuery(
      [this.queryKey, 'search', searchTerm],
      () => this.apiService.search(searchTerm, searchFields),
      'realtime'
    );
  }

  useCount() {
    return useOptimizedQuery(
      [this.queryKey, 'count'],
      () => this.apiService.count(),
      'static'
    );
  }

  // Write operations
  useCreate(customOptions?: UseMutationOptions<T, Error, TCreate>) {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (data: TCreate) => this.apiService.create(data),
      onSuccess: (data, variables) => {
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: [this.queryKey] });
        
        // Optimistic update for lists
        if (this.options.optimistic) {
          queryClient.setQueryData([this.queryKey, 'list'], (old: T[] | undefined) => {
            return old ? [data, ...old] : [data];
          });
        }
        
        if (this.options.enableToasts) {
          toast.success(`${this.queryKey} created successfully`);
        }
        
        customOptions?.onSuccess?.(data, variables, undefined);
      },
      onError: (error: Error, variables) => {
        console.error(`Create ${this.queryKey} error:`, error);
        if (this.options.enableToasts) {
          toast.error(`Failed to create ${this.queryKey}`, {
            description: error.message || 'Please try again later'
          });
        }
        customOptions?.onError?.(error, variables, undefined);
      },
      ...customOptions,
    });
  }

  useUpdate(customOptions?: UseMutationOptions<T, Error, { id: string; data: Partial<TCreate> }>) {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TCreate> }) => 
        this.apiService.update(id, data),
      onSuccess: (data, variables) => {
        // Update specific item cache
        queryClient.setQueryData([this.queryKey, 'detail', variables.id], data);
        
        // Update list cache
        queryClient.setQueryData([this.queryKey, 'list'], (old: T[] | undefined) => {
          return old?.map(item => item.id === variables.id ? data : item);
        });
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [this.queryKey] });
        
        if (this.options.enableToasts) {
          toast.success(`${this.queryKey} updated successfully`);
        }
        
        customOptions?.onSuccess?.(data, variables, undefined);
      },
      onError: (error: Error, variables) => {
        console.error(`Update ${this.queryKey} error:`, error);
        if (this.options.enableToasts) {
          toast.error(`Failed to update ${this.queryKey}`, {
            description: error.message || 'Please try again later'
          });
        }
        customOptions?.onError?.(error, variables, undefined);
      },
      ...customOptions,
    });
  }

  useDelete(customOptions?: UseMutationOptions<boolean, Error, string>) {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: (id: string) => this.apiService.delete(id),
      onSuccess: (success, id) => {
        // Remove from list cache
        queryClient.setQueryData([this.queryKey, 'list'], (old: T[] | undefined) => {
          return old?.filter(item => item.id !== id);
        });
        
        // Remove detail cache
        queryClient.removeQueries({ queryKey: [this.queryKey, 'detail', id] });
        
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: [this.queryKey, 'list'] });
        
        if (this.options.enableToasts) {
          toast.success(`${this.queryKey} deleted successfully`);
        }
        
        customOptions?.onSuccess?.(success, id, undefined);
      },
      onError: (error: Error, id) => {
        console.error(`Delete ${this.queryKey} error:`, error);
        if (this.options.enableToasts) {
          toast.error(`Failed to delete ${this.queryKey}`, {
            description: error.message || 'Please try again later'
          });
        }
        customOptions?.onError?.(error, id, undefined);
      },
      ...customOptions,
    });
  }

  // Helper methods
  protected getSearchFields(): string[] {
    // Override in subclasses to define search fields
    return ['name'];
  }

  // Cache utilities
  prefetchItem(id: string) {
    const queryClient = useQueryClient();
    return queryClient.prefetchQuery({
      queryKey: [this.queryKey, 'detail', id],
      queryFn: () => this.apiService.getById(id),
    });
  }

  invalidateAll() {
    const queryClient = useQueryClient();
    queryClient.invalidateQueries({ queryKey: [this.queryKey] });
  }

  getCachedData(id?: string): T | T[] | undefined {
    const queryClient = useQueryClient();
    if (id) {
      return queryClient.getQueryData([this.queryKey, 'detail', id]);
    }
    return queryClient.getQueryData([this.queryKey, 'list']);
  }
}