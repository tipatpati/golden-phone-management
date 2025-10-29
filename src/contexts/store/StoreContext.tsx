import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useUserStores, useActiveStores, useSetCurrentStore, type Store } from '@/services/stores';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

  // Simplified store initialization - relies on database persistence
  useEffect(() => {
    if (!isLoggedIn || currentStore || initializingRef.current) {
      return;
    }

    // Wait for data to load
    if (isSuperAdmin && allStoresLoading) return;
    if (!isSuperAdmin && userStoresLoading) return;

    const initializeStore = async () => {
      initializingRef.current = true;
      logger.info('Initializing store context', { isSuperAdmin }, 'StoreContext');

      try {
        let storeToSet: Store | undefined;

        if (isSuperAdmin) {
          // Super admins: select first available store
          storeToSet = allStoresData?.[0];
        } else {
          // Regular users: select default or first assigned store
          const defaultUserStore = userStoresData?.find(us => us.is_default);
          storeToSet = defaultUserStore?.store || userStoresData?.[0]?.store;
        }

        if (!storeToSet) {
          throw new Error('No stores available');
        }

        // Set store in backend (which also persists to user_session_preferences)
        await setCurrentStoreMutation.mutateAsync(storeToSet.id);
        
        // Update local state
        setCurrentStoreState(storeToSet);
        
        logger.info('Store context initialized', { 
          storeId: storeToSet.id,
          storeName: storeToSet.name 
        }, 'StoreContext');
        
        toast.success(`Contesto negozio impostato: ${storeToSet.name}`);
      } catch (error) {
        logger.error('Store initialization failed', { error }, 'StoreContext');
        toast.error('Impossibile inizializzare il contesto del negozio');
      } finally {
        initializingRef.current = false;
      }
    };

    initializeStore();
  }, [isLoggedIn, isSuperAdmin, allStoresData, userStoresData, currentStore, allStoresLoading, userStoresLoading]);

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
