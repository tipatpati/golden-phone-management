import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useUserStores, useActiveStores, useSetCurrentStore, type Store } from '@/services/stores';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

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
  const { user, isLoggedIn, userRole } = useAuth();
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  
  // Phase 2: Prevent initialization loop with ref guard
  const initializingRef = useRef(false);
  const mountedRef = useRef(false);

  // Check if user is super admin
  const isSuperAdmin = userRole === 'super_admin';

  // Fetch stores based on role
  // Super admins see all stores, regular users see only assigned stores
  const { data: userStoresData, isLoading: userStoresLoading, error: userStoresError } = useUserStores();
  const { data: allStoresData, isLoading: allStoresLoading, error: allStoresError } = useActiveStores();

  const setCurrentStoreMutation = useSetCurrentStore();

  // Determine which stores to use
  const isLoading = isSuperAdmin ? allStoresLoading : userStoresLoading;
  const error = isSuperAdmin ? allStoresError : userStoresError;

  // Extract stores based on role
  const userStores = useMemo(() => {
    if (isSuperAdmin) {
      // Super admin sees all active stores
      logger.debug('Super admin mode: showing all stores', { count: allStoresData?.length }, 'StoreContext');
      return allStoresData || [];
    } else {
      // Regular users see only assigned stores
      if (!userStoresData) return [];
      const stores = userStoresData
        .filter(us => us.store)
        .map(us => us.store!)
        .filter(store => store.is_active);
      logger.debug('Regular user mode: showing assigned stores', { count: stores.length }, 'StoreContext');
      return stores;
    }
  }, [isSuperAdmin, allStoresData, userStoresData]);

  // Set default store on mount
  useEffect(() => {
    // Phase 2: Prevent concurrent initializations
    if (!isLoggedIn || currentStore || initializingRef.current) return;
    
    // Phase 4: Log mount event
    if (!mountedRef.current) {
      logger.info('🏪 StoreContext mounting', {
        isLoggedIn,
        isSuperAdmin,
        currentStore: currentStore?.id,
        userStoresCount: userStores.length
      }, 'StoreContext');
      mountedRef.current = true;
    }
    
    initializingRef.current = true;

    const setInitialStore = async (store: Store, retryCount = 0) => {
      try {
        // Phase 4: Enhanced logging
        logger.info('📡 Setting initial store', { 
          storeId: store.id, 
          storeName: store.name, 
          attempt: retryCount 
        }, 'StoreContext');

        // IMPORTANT: Call backend to set session store
        await setCurrentStoreMutation.mutateAsync(store.id);

        // Update local state
        setCurrentStoreState(store);

        logger.info('✅ Initial store set successfully', { 
          storeId: store.id, 
          storeName: store.name 
        }, 'StoreContext');
        toast.success(`Contesto negozio impostato: ${store.name}`);
        
        // Phase 2: Clear initialization flag on success
        initializingRef.current = false;
      } catch (error) {
        logger.error('❌ Failed to set initial store', { error, retryCount }, 'StoreContext');
        
        // Retry logic with exponential backoff
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000;
          logger.info(`🔄 Retrying store initialization in ${delay}ms...`, { retryCount }, 'StoreContext');
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return setInitialStore(store, retryCount + 1);
        }
        
        // Phase 2: Clear initialization flag after final failure
        initializingRef.current = false;
        
        // Show user-facing error after all retries
        toast.error(
          'Impossibile inizializzare il contesto del negozio. Ricarica la pagina.',
          { duration: 10000 }
        );
      }
    };

    const assignAndSetStore = async (store: Store) => {
      try {
        // Import the helper at runtime to avoid circular dependencies
        const { assignUserToStore } = await import('@/services/stores/storeHelpers');
        await assignUserToStore(store.id);
        setCurrentStoreState(store);
        logger.info('User assigned and store set', { store: store.name }, 'StoreContext');
      } catch (error) {
        logger.error('Failed to assign user to store', { error }, 'StoreContext');
      }
    };

    if (isSuperAdmin) {
      // For super admin, use first available store
      if (allStoresData && allStoresData.length > 0) {
        logger.debug('Super admin: setting first store as default', { store: allStoresData[0].name }, 'StoreContext');
        
        // Check if user has store assignments
        if (!userStoresData || userStoresData.length === 0) {
          logger.debug('Super admin has no store assignments, creating one', {}, 'StoreContext');
          assignAndSetStore(allStoresData[0]);
        } else {
          setInitialStore(allStoresData[0]);
        }
      }
    } else {
      // For regular users, find their default assigned store
      if (!userStoresData) return;

      const defaultUserStore = userStoresData.find(us => us.is_default);
      if (defaultUserStore?.store) {
        setInitialStore(defaultUserStore.store);
      } else if (userStoresData.length > 0 && userStoresData[0].store) {
        // Fallback to first store if no default
        logger.debug('No default store, using first available', { store: userStoresData[0].store.name }, 'StoreContext');
        setInitialStore(userStoresData[0].store);
      }
    }
    
    // Phase 2: Cleanup function
    return () => {
      if (!currentStore) {
        initializingRef.current = false;
      }
    };
  }, [isSuperAdmin, allStoresData, userStoresData, isLoggedIn, currentStore, setCurrentStoreMutation]);

  // Handle store switching
  const handleSetCurrentStore = async (store: Store) => {
    try {
      // Phase 4: Enhanced logging
      logger.info('🔄 Switching store', { 
        fromId: currentStore?.id,
        fromName: currentStore?.name, 
        toId: store.id,
        toName: store.name 
      }, 'StoreContext');

      // Call backend to set session store
      await setCurrentStoreMutation.mutateAsync(store.id);

      // Update local state
      setCurrentStoreState(store);

      logger.info('✅ Store switched successfully', { store: store.name }, 'StoreContext');
      toast.success(`Cambiato a negozio: ${store.name}`);
    } catch (error) {
      logger.error('❌ Failed to switch store', { error }, 'StoreContext');
      toast.error('Impossibile cambiare negozio. Riprova.');
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
