import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useUserStores, useActiveStores, useSetCurrentStore, type Store } from '@/services/stores';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface StoreContextType {
  currentStore: Store | null;
  setCurrentStore: (store: Store) => Promise<void>;
  userStores: Store[];
  isLoading: boolean;
  error: Error | null;
  isSuperAdmin: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { isLoggedIn, userRole } = useAuth();
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const isSuperAdmin = useMemo(() => userRole === 'super_admin', [userRole]);

  // Fetch stores based on role
  const { data: userStoresData, isLoading: userStoresLoading, error: userStoresError } = useUserStores();
  const { data: allStoresData, isLoading: allStoresLoading, error: allStoresError } = useActiveStores();
  const setCurrentStoreMutation = useSetCurrentStore();

  // Determine loading state - check both queries during initialization
  const isLoading = useMemo(() => {
    if (!isLoggedIn) return false;
    return isSuperAdmin ? allStoresLoading : userStoresLoading;
  }, [isLoggedIn, isSuperAdmin, allStoresLoading, userStoresLoading]);

  const error = isSuperAdmin ? allStoresError : userStoresError;

  // Log when store data changes
  useEffect(() => {
    if (!isLoading && (userStoresData || allStoresData)) {
      logger.info('Store data loaded', {
        isSuperAdmin,
        allStoresCount: allStoresData?.length || 0,
        userStoresAssignmentsCount: userStoresData?.length || 0
      }, 'StoreContext');
    }
  }, [isLoading, userStoresData, allStoresData, isSuperAdmin]);

  // Extract stores based on role - ONLY return data when fully loaded
  const userStores = useMemo(() => {
    // During loading, return empty array but isLoading will be true
    if (isSuperAdmin) {
      // For super admin, return all stores only when data is loaded
      if (!allStoresData) return [];
      return allStoresData;
    } else {
      // For regular users, extract stores from assignments
      if (!userStoresData) return [];
      return userStoresData
        .filter(us => us.store)
        .map(us => us.store!)
        .filter(store => store.is_active);
    }
  }, [isSuperAdmin, allStoresData, userStoresData]);

  // Simple initialization - set the first available store
  useEffect(() => {
    // Skip if not logged in, already have a store, or still loading
    if (!isLoggedIn || currentStore || isLoading) return;

    // Skip if no stores available
    if (userStores.length === 0) {
      logger.warn('No stores available for user', { userRole }, 'StoreContext');
      return;
    }

    // Find the default store or use the first one
    let storeToSet: Store | null = null;

    if (isSuperAdmin) {
      // Super admin: use first available store
      storeToSet = userStores[0];
      logger.info('Setting first store for super admin', { store: storeToSet.name }, 'StoreContext');
    } else {
      // Regular user: find default or use first
      const defaultUserStore = userStoresData?.find(us => us.is_default);
      storeToSet = defaultUserStore?.store || userStores[0];
      logger.info('Setting default store for user', { store: storeToSet?.name }, 'StoreContext');
    }

    if (storeToSet) {
      // Set locally first for responsive UI
      setCurrentStoreState(storeToSet);

      // Sync to backend (blocking to ensure persistence before operations)
      // This ensures get_user_current_store_id() can read from user_session_preferences
      setCurrentStoreMutation.mutateAsync(storeToSet.id).catch(err => {
        logger.error('Failed to persist store context to backend', { error: err }, 'StoreContext');
        // Context is set locally, so UI works, but backend operations may fail
      });
    }
  }, [isLoggedIn, currentStore, isLoading, userStores, isSuperAdmin, userStoresData, setCurrentStoreMutation, userRole]);

  // Handle store switching (user action)
  const handleSetCurrentStore = async (store: Store) => {
    logger.info('User switching store', { from: currentStore?.name, to: store.name }, 'StoreContext');

    // Update local state immediately for responsive UI
    setCurrentStoreState(store);

    // Sync to backend - let the mutation handle errors
    try {
      await setCurrentStoreMutation.mutateAsync(store.id);
      logger.info('Store switched successfully', { store: store.name }, 'StoreContext');
    } catch (error) {
      logger.error('Failed to sync store switch to backend', { error }, 'StoreContext');
      // Don't revert local state - user can still work with local state
      // The mutation already shows error toast
      throw error;
    }
  };

  const contextValue: StoreContextType = {
    currentStore,
    setCurrentStore: handleSetCurrentStore,
    userStores,
    isLoading,
    error: error as Error | null,
    isSuperAdmin,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// Convenience hook to get just the current store ID
export function useCurrentStoreId(): string | null {
  const { currentStore } = useStore();
  return currentStore?.id || null;
}

// Convenience hook to check if user has access to multiple stores
export function useHasMultipleStores(): boolean {
  const { userStores } = useStore();
  return userStores.length > 1;
}
