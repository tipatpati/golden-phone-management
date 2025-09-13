/**
 * Data Flow Reliability Service
 * Provides optimistic updates, retry logic, and state synchronization
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/utils/secureLogger';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { LoadingState, AsyncState } from '@/types/global';
import { StateStore } from '@/services/core/StateManager';

/**
 * Optimistic update manager
 */
export class OptimisticUpdateManager<T> {
  private pendingUpdates = new Map<string, T>();
  private rollbackMap = new Map<string, T>();
  private store: StateStore<T>;

  constructor(store: StateStore<T>) {
    this.store = store;
  }

  /**
   * Apply optimistic update
   */
  applyUpdate(
    id: string, 
    optimisticData: T, 
    operation: () => Promise<T>
  ): Promise<T> {
    // Store original data for rollback
    const originalData = this.store.getState();
    this.rollbackMap.set(id, originalData);

    // Apply optimistic update immediately
    this.pendingUpdates.set(id, optimisticData);
    this.store.setState(optimisticData, 'OPTIMISTIC_UPDATE');

    logger.debug('Optimistic update applied', { id }, 'OptimisticUpdateManager');

    // Execute actual operation
    return operation()
      .then((result) => {
        // Success: commit the update
        this.commitUpdate(id, result);
        return result;
      })
      .catch((error) => {
        // Failure: rollback
        this.rollbackUpdate(id);
        throw error;
      });
  }

  /**
   * Commit successful update
   */
  private commitUpdate(id: string, finalData: T): void {
    this.pendingUpdates.delete(id);
    this.rollbackMap.delete(id);
    this.store.setState(finalData, 'COMMIT_UPDATE');
    
    logger.debug('Optimistic update committed', { id }, 'OptimisticUpdateManager');
  }

  /**
   * Rollback failed update
   */
  private rollbackUpdate(id: string): void {
    const originalData = this.rollbackMap.get(id);
    if (originalData) {
      this.store.setState(originalData, 'ROLLBACK_UPDATE');
      this.pendingUpdates.delete(id);
      this.rollbackMap.delete(id);
      
      logger.warn('Optimistic update rolled back', { id }, 'OptimisticUpdateManager');
    }
  }

  /**
   * Check if update is pending
   */
  isPending(id: string): boolean {
    return this.pendingUpdates.has(id);
  }

  /**
   * Get pending updates count
   */
  getPendingCount(): number {
    return this.pendingUpdates.size;
  }
}

/**
 * Retry manager with exponential backoff
 */
export class RetryManager {
  private retryAttempts = new Map<string, number>();
  private retryTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operationId: string,
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      shouldRetry?: (error: Error) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      shouldRetry = () => true
    } = options;

    const currentAttempt = this.retryAttempts.get(operationId) || 0;

    try {
      const result = await operation();
      
      // Success: reset retry count
      this.retryAttempts.delete(operationId);
      this.clearTimeout(operationId);
      
      logger.debug('Operation succeeded', { 
        operationId, 
        attempts: currentAttempt + 1 
      }, 'RetryManager');
      
      return result;
    } catch (error) {
      const errorInstance = error as Error;
      
      // Check if we should retry
      if (currentAttempt >= maxRetries || !shouldRetry(errorInstance)) {
        this.retryAttempts.delete(operationId);
        this.clearTimeout(operationId);
        
        logger.error('Operation failed after retries', { 
          operationId, 
          attempts: currentAttempt + 1,
          maxRetries,
          error: errorInstance.message
        }, 'RetryManager');
        
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, currentAttempt),
        maxDelay
      );

      // Update retry count
      this.retryAttempts.set(operationId, currentAttempt + 1);

      logger.warn('Operation failed, retrying', { 
        operationId, 
        attempt: currentAttempt + 1,
        nextRetryIn: delay,
        error: errorInstance.message
      }, 'RetryManager');

      // Wait and retry
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(async () => {
          try {
            const result = await this.executeWithRetry(operationId, operation, options);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        }, delay);

        this.retryTimeouts.set(operationId, timeout);
      });
    }
  }

  /**
   * Cancel retry for operation
   */
  cancelRetry(operationId: string): void {
    this.retryAttempts.delete(operationId);
    this.clearTimeout(operationId);
    
    logger.debug('Retry cancelled', { operationId }, 'RetryManager');
  }

  /**
   * Get retry status
   */
  getRetryStatus(operationId: string) {
    return {
      attempts: this.retryAttempts.get(operationId) || 0,
      isRetrying: this.retryTimeouts.has(operationId)
    };
  }

  /**
   * Clear timeout for operation
   */
  private clearTimeout(operationId: string): void {
    const timeout = this.retryTimeouts.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      this.retryTimeouts.delete(operationId);
    }
  }

  /**
   * Cleanup all retries
   */
  cleanup(): void {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryAttempts.clear();
    this.retryTimeouts.clear();
  }
}

/**
 * Data synchronization manager
 */
export class DataSyncManager {
  private syncQueue = new Map<string, () => Promise<void>>();
  private syncInProgress = new Set<string>();
  private lastSyncTime = new Map<string, number>();

  /**
   * Queue data for synchronization
   */
  queueSync(
    syncId: string,
    syncOperation: () => Promise<void>,
    options: {
      debounceMs?: number;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): void {
    const { debounceMs = 1000, priority = 'medium' } = options;

    // Cancel existing sync if debouncing
    if (this.syncQueue.has(syncId)) {
      logger.debug('Replacing queued sync', { syncId }, 'DataSyncManager');
    }

    // Debounce sync operations
    setTimeout(() => {
      this.syncQueue.set(syncId, syncOperation);
      this.processSyncQueue();
    }, debounceMs);
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    for (const [syncId, operation] of this.syncQueue.entries()) {
      if (this.syncInProgress.has(syncId)) {
        continue; // Skip if already in progress
      }

      this.syncInProgress.add(syncId);
      this.syncQueue.delete(syncId);

      try {
        logger.debug('Starting sync operation', { syncId }, 'DataSyncManager');
        
        await operation();
        
        this.lastSyncTime.set(syncId, Date.now());
        
        logger.debug('Sync operation completed', { syncId }, 'DataSyncManager');
      } catch (error) {
        logger.error('Sync operation failed', { 
          syncId, 
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'DataSyncManager');
      } finally {
        this.syncInProgress.delete(syncId);
      }
    }
  }

  /**
   * Force immediate sync
   */
  async forceSync(syncId: string, operation: () => Promise<void>): Promise<void> {
    if (this.syncInProgress.has(syncId)) {
      logger.warn('Sync already in progress', { syncId }, 'DataSyncManager');
      return;
    }

    this.syncInProgress.add(syncId);

    try {
      await operation();
      this.lastSyncTime.set(syncId, Date.now());
    } finally {
      this.syncInProgress.delete(syncId);
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(syncId: string) {
    return {
      isQueued: this.syncQueue.has(syncId),
      isInProgress: this.syncInProgress.has(syncId),
      lastSynced: this.lastSyncTime.get(syncId)
    };
  }

  /**
   * Clear all pending syncs
   */
  clearAll(): void {
    this.syncQueue.clear();
    this.syncInProgress.clear();
    logger.debug('All sync operations cleared', {}, 'DataSyncManager');
  }
}

/**
 * React hook for reliable data operations
 */
export function useReliableDataOperation<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: 'idle',
    error: null
  });

  const { handleError } = useErrorHandler({ context: 'ReliableDataOperation' });
  const retryManager = useRef(new RetryManager());
  const operationId = useRef(0);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    options: {
      enableRetry?: boolean;
      maxRetries?: number;
      enableOptimistic?: boolean;
      optimisticData?: T;
    } = {}
  ) => {
    const {
      enableRetry = true,
      maxRetries = 3,
      enableOptimistic = false,
      optimisticData
    } = options;

    const currentOperationId = `operation-${++operationId.current}`;

    setState(prev => ({ 
      ...prev, 
      loading: 'loading', 
      error: null,
      ...(enableOptimistic && optimisticData ? { data: optimisticData } : {})
    }));

    try {
      let result: T;

      if (enableRetry) {
        result = await retryManager.current.executeWithRetry(
          currentOperationId,
          operation,
          { maxRetries }
        );
      } else {
        result = await operation();
      }

      setState(prev => ({
        ...prev,
        data: result,
        loading: 'success',
        error: null
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: 'error',
        error: error instanceof Error ? error.message : 'Operation failed',
        ...(enableOptimistic ? { data: null } : {}) // Rollback optimistic data
      }));

      handleError(error, 'Data operation failed');
      throw error;
    }
  }, [handleError]);

  const reset = useCallback(() => {
    setState({ data: null, loading: 'idle', error: null });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      retryManager.current.cleanup();
    };
  }, []);

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading === 'loading',
    isError: state.loading === 'error',
    isSuccess: state.loading === 'success',
    isIdle: state.loading === 'idle'
  };
}

// Export manager instances
export const globalRetryManager = new RetryManager();
export const globalSyncManager = new DataSyncManager();