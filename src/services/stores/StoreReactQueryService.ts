import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApiService } from './StoreApiService';
import type { Store, CreateStoreData, UpdateStoreData, AssignUserToStoreData } from './types';
import { toast } from 'sonner';

// Query keys
export const storeKeys = {
  all: ['stores'] as const,
  active: ['stores', 'active'] as const,
  byId: (id: string) => ['stores', id] as const,
  byCode: (code: string) => ['stores', 'code', code] as const,
  userStores: (userId?: string) => ['user-stores', userId] as const,
  currentUserStores: ['user-stores', 'current'] as const,
  defaultStore: (userId?: string) => ['stores', 'default', userId] as const,
};

// ==========================================
// QUERY HOOKS
// ==========================================

/**
 * Get all stores (respects RLS)
 */
export function useStores() {
  return useQuery({
    queryKey: storeKeys.all,
    queryFn: () => storeApiService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get active stores only
 */
export function useActiveStores() {
  return useQuery({
    queryKey: storeKeys.active,
    queryFn: () => storeApiService.getActiveStores(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get store by ID
 */
export function useStore(id: string) {
  return useQuery({
    queryKey: storeKeys.byId(id),
    queryFn: () => storeApiService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get store by code
 */
export function useStoreByCode(code: string) {
  return useQuery({
    queryKey: storeKeys.byCode(code),
    queryFn: () => storeApiService.getByCode(code),
    enabled: !!code,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get stores assigned to a user
 */
export function useUserStores(userId?: string) {
  return useQuery({
    queryKey: storeKeys.userStores(userId),
    queryFn: () => userId
      ? storeApiService.getUserStores(userId)
      : storeApiService.getCurrentUserStores(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get user's default store
 */
export function useUserDefaultStore(userId?: string) {
  return useQuery({
    queryKey: storeKeys.defaultStore(userId),
    queryFn: async () => {
      if (!userId) {
        const stores = await storeApiService.getCurrentUserStores();
        const defaultStore = stores.find(us => us.is_default);
        return defaultStore?.store || null;
      }
      return storeApiService.getUserDefaultStore(userId);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================================
// MUTATION HOOKS
// ==========================================

/**
 * Create a new store
 */
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoreData) => storeApiService.create(data),
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
      queryClient.invalidateQueries({ queryKey: storeKeys.active });
      toast.success(`Store "${store.name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to create store: ${error.message}`);
    },
  });
}

/**
 * Update a store
 */
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStoreData) => storeApiService.update(data),
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
      queryClient.invalidateQueries({ queryKey: storeKeys.active });
      queryClient.invalidateQueries({ queryKey: storeKeys.byId(store.id) });
      toast.success(`Store "${store.name}" updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update store: ${error.message}`);
    },
  });
}

/**
 * Deactivate a store (soft delete)
 */
export function useDeactivateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storeApiService.deactivate(id),
    onSuccess: (store) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
      queryClient.invalidateQueries({ queryKey: storeKeys.active });
      queryClient.invalidateQueries({ queryKey: storeKeys.byId(store.id) });
      toast.success(`Store "${store.name}" deactivated`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate store: ${error.message}`);
    },
  });
}

/**
 * Delete a store (hard delete - use with caution)
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storeApiService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeKeys.all });
      queryClient.invalidateQueries({ queryKey: storeKeys.active });
      toast.success('Store deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete store: ${error.message}`);
    },
  });
}

/**
 * Assign user to a store
 */
export function useAssignUserToStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssignUserToStoreData) => storeApiService.assignUserToStore(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.userStores(variables.user_id) });
      queryClient.invalidateQueries({ queryKey: storeKeys.currentUserStores });
      queryClient.invalidateQueries({ queryKey: storeKeys.defaultStore(variables.user_id) });
      toast.success('User assigned to store successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign user to store: ${error.message}`);
    },
  });
}

/**
 * Remove user from a store
 */
export function useRemoveUserFromStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, storeId }: { userId: string; storeId: string }) =>
      storeApiService.removeUserFromStore(userId, storeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.userStores(variables.userId) });
      queryClient.invalidateQueries({ queryKey: storeKeys.currentUserStores });
      queryClient.invalidateQueries({ queryKey: storeKeys.defaultStore(variables.userId) });
      toast.success('User removed from store successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove user from store: ${error.message}`);
    },
  });
}

/**
 * Set user's default store
 */
export function useSetDefaultStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, storeId }: { userId: string; storeId: string }) =>
      storeApiService.setDefaultStore(userId, storeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: storeKeys.userStores(variables.userId) });
      queryClient.invalidateQueries({ queryKey: storeKeys.currentUserStores });
      queryClient.invalidateQueries({ queryKey: storeKeys.defaultStore(variables.userId) });
      toast.success('Default store updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to set default store: ${error.message}`);
    },
  });
}

/**
 * Set current store for the session
 */
export function useSetCurrentStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => storeApiService.setCurrentStore(storeId),
    onSuccess: () => {
      // Invalidate all data queries as they now need to re-fetch with new store context
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      // Don't show toast - this is called automatically on store switch
    },
    onError: (error: Error) => {
      toast.error(`Failed to switch store: ${error.message}`);
    },
  });
}
