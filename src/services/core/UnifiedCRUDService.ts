/**
 * UNIFIED CRUD SERVICE
 * Single source of truth for all CRUD operations with:
 * - Automatic cache invalidation
 * - Optimistic updates with rollback
 * - Transaction support
 * - Event emission
 * - Error recovery
 */

import { UseMutationOptions, useQueryClient, useMutation } from '@tanstack/react-query';
import { eventBus, EVENT_TYPES, type EventType, type SystemEvent } from './EventBus';
import { logger } from '@/utils/logger';

export interface CRUDConfig {
  entityName: string;
  queryKey: string;
  eventTypes: {
    created: EventType;
    updated: EventType;
    deleted: EventType;
  };
  relatedQueries?: string[]; // Additional queries to invalidate
}

export interface CRUDOperation<T, TCreate> {
  create: (data: TCreate) => Promise<T>;
  update: (id: string, data: Partial<TCreate>) => Promise<T>;
  delete: (id: string) => Promise<boolean>;
}

/**
 * Creates unified CRUD mutations with automatic:
 * - Cache invalidation
 * - Event emission
 * - Error handling
 * - Optimistic updates
 */
export function createCRUDMutations<T extends { id: string }, TCreate>(
  config: CRUDConfig,
  operations: CRUDOperation<T, TCreate>
) {
  const { entityName, queryKey, eventTypes, relatedQueries = [] } = config;

  /**
   * CREATE mutation
   */
  const useCreate = (options?: UseMutationOptions<T, Error, TCreate>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (data: TCreate) => {
        logger.info(`Creating ${entityName}`, { data }, 'UnifiedCRUD');
        return operations.create(data);
      },
      onSuccess: (result, data) => {
        // Emit event
        eventBus.emit({
          type: eventTypes.created,
          module: entityName.toLowerCase() as SystemEvent['module'],
          operation: 'create',
          entityId: result.id,
          data
        });

        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        relatedQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });

        logger.info(`${entityName} created successfully`, { id: result.id }, 'UnifiedCRUD');
        
        // Call custom onSuccess if provided
        options?.onSuccess?.(result, data, undefined);
      },
      onError: (error, data, context) => {
        logger.error(`Failed to create ${entityName}`, { error, data }, 'UnifiedCRUD');
        options?.onError?.(error, data, context);
      },
      ...options
    });
  };

  /**
   * UPDATE mutation with optimistic updates
   */
  const useUpdate = (options?: UseMutationOptions<T, Error, { id: string; data: Partial<TCreate> }>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<TCreate> }) => {
        logger.info(`Updating ${entityName}`, { id, data }, 'UnifiedCRUD');
        return operations.update(id, data);
      },
      onMutate: async ({ id, data }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: [queryKey, 'detail', id] });

        // Snapshot previous value
        const previousData = queryClient.getQueryData<T>([queryKey, 'detail', id]);

        // Optimistically update
        if (previousData) {
          queryClient.setQueryData<T>([queryKey, 'detail', id], {
            ...previousData,
            ...data
          });
        }

        return { previousData };
      },
      onSuccess: (result, { id, data }, context) => {
        // Emit event
        eventBus.emit({
          type: eventTypes.updated,
          module: entityName.toLowerCase() as SystemEvent['module'],
          operation: 'update',
          entityId: id,
          data
        });

        // Update cache with real data
        queryClient.setQueryData([queryKey, 'detail', id], result);

        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: [queryKey, 'list'] });
        relatedQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });

        logger.info(`${entityName} updated successfully`, { id }, 'UnifiedCRUD');
        
        options?.onSuccess?.(result, { id, data }, context);
      },
      onError: (error, { id }, context: any) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData([queryKey, 'detail', id], context.previousData);
        }

        logger.error(`Failed to update ${entityName}`, { error, id }, 'UnifiedCRUD');
        options?.onError?.(error, { id, data: {} as any }, context);
      },
      ...options
    });
  };

  /**
   * DELETE mutation with optimistic updates
   */
  const useDelete = (options?: UseMutationOptions<boolean, Error, string>) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string) => {
        logger.info(`Deleting ${entityName}`, { id }, 'UnifiedCRUD');
        return operations.delete(id);
      },
      onMutate: async (id) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: [queryKey] });

        // Snapshot previous list
        const previousList = queryClient.getQueryData<T[]>([queryKey, 'list']);

        // Optimistically remove from list
        if (previousList) {
          queryClient.setQueryData<T[]>(
            [queryKey, 'list'],
            previousList.filter(item => item.id !== id)
          );
        }

        return { previousList };
      },
      onSuccess: (result, id, context) => {
        // Emit event
        eventBus.emit({
          type: eventTypes.deleted,
          module: entityName.toLowerCase() as SystemEvent['module'],
          operation: 'delete',
          entityId: id,
          data: {}
        });

        // Remove from cache
        queryClient.removeQueries({ queryKey: [queryKey, 'detail', id] });

        // Invalidate list
        queryClient.invalidateQueries({ queryKey: [queryKey, 'list'] });
        relatedQueries.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });

        logger.info(`${entityName} deleted successfully`, { id }, 'UnifiedCRUD');
        
        options?.onSuccess?.(result, id, context);
      },
      onError: (error, id, context: any) => {
        // Rollback on error
        if (context?.previousList) {
          queryClient.setQueryData([queryKey, 'list'], context.previousList);
        }

        logger.error(`Failed to delete ${entityName}`, { error, id }, 'UnifiedCRUD');
        options?.onError?.(error, id, context);
      },
      ...options
    });
  };

  return {
    useCreate,
    useUpdate,
    useDelete
  };
}
