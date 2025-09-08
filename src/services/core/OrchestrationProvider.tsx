import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dataOrchestrator } from './DataOrchestrator';
import { eventBus } from './EventBus';
import { cacheManager } from './CacheManager';
import { advancedCacheManager } from './AdvancedCacheManager';
import { dataConsistencyLayer } from './DataConsistencyLayer';
import { conflictResolution } from './ConflictResolution';
import { logger } from '@/utils/logger';

interface OrchestrationContextType {
  isInitialized: boolean;
  orchestrator: typeof dataOrchestrator;
  eventBus: typeof eventBus;
  cacheManager: typeof cacheManager;
  advancedCacheManager: typeof advancedCacheManager;
  dataConsistencyLayer: typeof dataConsistencyLayer;
  conflictResolution: typeof conflictResolution;
}

const OrchestrationContext = createContext<OrchestrationContextType | null>(null);

/**
 * Provider component that initializes the data orchestration system
 * Should be placed near the root of the app, after QueryClient setup
 */
export function OrchestrationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const initializeRef = useRef(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    if (initializeRef.current) return;
    initializeRef.current = true;

    const initializeOrchestration = async () => {
      try {
        logger.info('OrchestrationProvider: Initializing data orchestration system');
        
        // Initialize the orchestrator with the query client
        await dataOrchestrator.initialize(queryClient);
        
        // Initialize advanced cache manager with optimizations
        await advancedCacheManager.initialize(queryClient, {
          enablePrefetching: true,
          enableBatchInvalidation: true,
          enableOptimisticUpdates: true,
          enableBackgroundRefresh: true
        });

        // Initialize data consistency layer
        await dataConsistencyLayer.initialize(queryClient);
        
        // Initialize conflict resolution
        await conflictResolution.initialize(queryClient);
        
        setIsInitialized(true);
        
        logger.info('OrchestrationProvider: Data orchestration system initialized successfully');
      } catch (error) {
        logger.error('OrchestrationProvider: Failed to initialize orchestration system', error);
      }
    };

    initializeOrchestration();
  }, [queryClient]);

  const contextValue = {
    isInitialized,
    orchestrator: dataOrchestrator,
    eventBus,
    cacheManager,
    advancedCacheManager,
    dataConsistencyLayer,
    conflictResolution
  };

  return (
    <OrchestrationContext.Provider value={contextValue}>
      {children}
    </OrchestrationContext.Provider>
  );
}

/**
 * Hook to access the orchestration system
 */
export function useOrchestration() {
  const context = useContext(OrchestrationContext);
  if (!context) {
    throw new Error('useOrchestration must be used within an OrchestrationProvider');
  }
  return context;
}

/**
 * Hook to emit events through the orchestration system
 */
export function useOrchestratedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    eventType?: string;
    module?: 'sales' | 'inventory' | 'clients';
    operation?: 'create' | 'update' | 'delete';
  }
) {
  const { eventBus, isInitialized } = useOrchestration();

  const orchestratedMutationFn = async (variables: TVariables): Promise<TData> => {
    if (!isInitialized) {
      logger.warn('useOrchestratedMutation: Orchestration not initialized, executing without events');
      return await mutationFn(variables);
    }

    try {
      // Execute the mutation
      const result = await mutationFn(variables);

      // Emit success event if configured
      if (options?.eventType && options?.module && options?.operation) {
        await eventBus.emit({
          type: options.eventType,
          module: options.module,
          operation: options.operation,
          entityId: (result as any)?.id || 'unknown',
          data: { variables, result }
        });
      }

      // Call onSuccess callback
      options?.onSuccess?.(result, variables);

      return result;
    } catch (error) {
      // Call onError callback
      options?.onError?.(error as Error, variables);
      throw error;
    }
  };

  return orchestratedMutationFn;
}