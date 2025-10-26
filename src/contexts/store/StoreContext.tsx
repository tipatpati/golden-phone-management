import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useUserStores, useSetCurrentStore, type Store } from '@/services/stores';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

interface StoreContextType {
  currentStore: Store | null;
  setCurrentStore: (store: Store) => Promise<void>;
  userStores: Store[];
  isLoading: boolean;
  error: Error | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

interface StoreProviderProps {
  children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { user, isLoggedIn } = useAuth();
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);

  // Fetch user's assigned stores
  const { data: userStoresData, isLoading, error } = useUserStores();
  const setCurrentStoreMutation = useSetCurrentStore();

  // Extract stores from user_stores data
  const userStores = useMemo(() => {
    if (!userStoresData) return [];
    return userStoresData
      .filter(us => us.store)
      .map(us => us.store!)
      .filter(store => store.is_active); // Only active stores
  }, [userStoresData]);

  // Set default store on mount
  useEffect(() => {
    if (!isLoggedIn || !userStoresData || currentStore) return;

    // Find default store
    const defaultUserStore = userStoresData.find(us => us.is_default);
    if (defaultUserStore?.store) {
      logger.debug('Setting default store', { store: defaultUserStore.store.name }, 'StoreContext');
      setCurrentStoreState(defaultUserStore.store);
    } else if (userStoresData.length > 0 && userStoresData[0].store) {
      // Fallback to first store if no default
      logger.debug('No default store, using first available', { store: userStoresData[0].store.name }, 'StoreContext');
      setCurrentStoreState(userStoresData[0].store);
    }
  }, [userStoresData, isLoggedIn, currentStore]);

  // Handle store switching
  const handleSetCurrentStore = async (store: Store) => {
    try {
      logger.debug('Switching to store', { from: currentStore?.name, to: store.name }, 'StoreContext');

      // Call backend to set session store
      await setCurrentStoreMutation.mutateAsync(store.id);

      // Update local state
      setCurrentStoreState(store);

      logger.info('Store switched successfully', { store: store.name }, 'StoreContext');
    } catch (error) {
      logger.error('Failed to switch store', { error }, 'StoreContext');
      throw error;
    }
  };

  const contextValue: StoreContextType = {
    currentStore,
    setCurrentStore: handleSetCurrentStore,
    userStores,
    isLoading,
    error: error as Error | null,
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
