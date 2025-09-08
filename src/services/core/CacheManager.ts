import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { eventBus, EVENT_TYPES, type ModuleEvent } from './EventBus';
import { AdvancedCacheManager, advancedCacheManager } from './AdvancedCacheManager';

/**
 * Legacy cache manager - now delegates to AdvancedCacheManager
 * Maintained for backward compatibility
 */
export class CacheManager {
  private static instance: CacheManager;
  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize - delegates to AdvancedCacheManager
   */
  initialize(queryClient: QueryClient): void {
    advancedCacheManager.initialize(queryClient);
  }

  // Delegate all methods to AdvancedCacheManager for backward compatibility
  async invalidateQueryKey(queryKey: string): Promise<void> {
    await advancedCacheManager.forceRefresh([[queryKey]]);
  }

  async refetchQueryKey(queryKey: string): Promise<void> {
    await advancedCacheManager.forceRefresh([[queryKey]]);
  }

  async updateCacheData<T>(
    queryKey: string[], 
    entityId: string, 
    updater: (oldData: T) => T
  ): Promise<void> {
    // This would be handled by optimistic updates in AdvancedCacheManager
    logger.debug('CacheManager: Delegating cache update to AdvancedCacheManager');
  }

  async warmCache(queries: Array<{ queryKey: string[]; queryFn: () => Promise<any> }>): Promise<void> {
    await advancedCacheManager.warmCache();
  }

  async clearAll(): Promise<void> {
    await advancedCacheManager.clearAll();
  }

  getCacheStats(): any {
    return advancedCacheManager.getCacheStatistics();
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();