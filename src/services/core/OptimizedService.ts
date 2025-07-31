import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";

interface ServiceConfig {
  queryKey: string;
  entityName: string;
  successMessages?: {
    create?: string;
    update?: string;
    delete?: string;
  };
}

/**
 * Generic service hook that provides common CRUD operations
 * Reduces code duplication across different entity services
 */
export function useOptimizedService<TEntity, TCreateData, TUpdateData>(
  config: ServiceConfig,
  apiService: {
    getAll: () => Promise<TEntity[]>;
    getById: (id: string) => Promise<TEntity>;
    create: (data: TCreateData) => Promise<TEntity>;
    update: (id: string, data: TUpdateData) => Promise<TEntity>;
    delete: (id: string) => Promise<void>;
  }
) {
  const queryClient = useQueryClient();
  const { queryKey, entityName, successMessages } = config;

  // Optimized queries with better caching
  const useGetAll = () => {
    return useQuery({
      queryKey: [queryKey],
      queryFn: apiService.getAll,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    });
  };

  const useGetById = (id: string) => {
    return useQuery({
      queryKey: [queryKey, id],
      queryFn: () => apiService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Optimized mutations with automatic cache updates
  const useCreate = () => {
    return useMutation({
      mutationFn: apiService.create,
      onSuccess: (newEntity) => {
        // Update the cache immediately
        queryClient.setQueryData([queryKey], (old: TEntity[] | undefined) => {
          return old ? [...old, newEntity] : [newEntity];
        });
        
        toast.success(successMessages?.create || `${entityName} created successfully`);
      },
      onError: (error: any) => {
        toast.error(`Failed to create ${entityName.toLowerCase()}: ${error.message}`);
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdateData }) => 
        apiService.update(id, data),
      onSuccess: (updatedEntity, { id }) => {
        // Update both list and individual entity caches
        queryClient.setQueryData([queryKey], (old: TEntity[] | undefined) => {
          return old?.map(item => 
            (item as any).id === id ? updatedEntity : item
          ) || [];
        });
        
        queryClient.setQueryData([queryKey, id], updatedEntity);
        
        toast.success(successMessages?.update || `${entityName} updated successfully`);
      },
      onError: (error: any) => {
        toast.error(`Failed to update ${entityName.toLowerCase()}: ${error.message}`);
      },
    });
  };

  const useDelete = () => {
    return useMutation({
      mutationFn: apiService.delete,
      onSuccess: (_, deletedId) => {
        // Remove from cache immediately
        queryClient.setQueryData([queryKey], (old: TEntity[] | undefined) => {
          return old?.filter(item => (item as any).id !== deletedId) || [];
        });
        
        // Remove individual entity cache
        queryClient.removeQueries({ queryKey: [queryKey, deletedId] });
        
        toast.success(successMessages?.delete || `${entityName} deleted successfully`);
      },
      onError: (error: any) => {
        toast.error(`Failed to delete ${entityName.toLowerCase()}: ${error.message}`);
      },
    });
  };

  // Utility functions for cache management
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  };

  const prefetchEntity = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: [queryKey, id],
      queryFn: () => apiService.getById(id),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    useGetAll,
    useGetById,
    useCreate,
    useUpdate,
    useDelete,
    invalidateQueries,
    prefetchEntity,
  };
}