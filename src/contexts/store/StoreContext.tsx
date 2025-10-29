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
  const isSuperAdmin = userRole === 'super_admin';

  // Fetch stores based on role
  const { data: userStoresData, isLoading: userStoresLoading, error: userStoresError } = useUserStores();
  const { data: allStoresData, isLoading: allStoresLoading, error: allStoresError } = useActiveStores();
  const setCurrentStoreMutation = useSetCurrentStore();

  // Determine loading and error state
  const isLoading = isSuperAdmin ? allStoresLoading : userStoresLoading;
  const error = isSuperAdmin ? allStoresError : userStoresError;

  // Extract stores based on role
  const userStores = useMemo(() => {
    if (isSuperAdmin) {
      return allStoresData || [];
    } else {
      if (!userStoresData) return [];
      return userStoresData
        .filter(us => us.store)
        .map(us => us.store!)
        .filter(store => store.is_active);
    }
  }, [isSuperAdmin, allStoresData, userStoresData]);

  // Simple initialization - just set the first available store locally
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
      // Just set it locally - no backend call, no retries, no complexity
      setCurrentStoreState(storeToSet);

      // Silently call backend to sync session (non-blocking, fire and forget)
      setCurrentStoreMutation.mutateAsync(storeToSet.id).catch(err => {
        logger.warn('Failed to sync store to backend (non-critical)', { error: err }, 'StoreContext');
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
