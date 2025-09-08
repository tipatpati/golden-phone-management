import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { eventBus, EVENT_TYPES, type ModuleEvent } from './EventBus';

/**
 * Smart cache manager that handles cross-module dependencies
 * and optimizes query invalidation based on data relationships
 */
export class CacheManager {
  private static instance: CacheManager;
  private queryClient: QueryClient | null = null;
  private dependencyMap = new Map<string, string[]>();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize the cache manager with a query client
   */
  initialize(queryClient: QueryClient): void {
    if (this.isInitialized) return;

    this.queryClient = queryClient;
    this.setupDependencyMap();
    this.registerEventListeners();
    this.isInitialized = true;

    logger.info('CacheManager: Initialized');
  }

  /**
   * Setup dependency relationships between different data types
   */
  private setupDependencyMap(): void {
    // Sales dependencies
    this.dependencyMap.set('sales', ['products', 'clients', 'product_units', 'sold_product_units']);
    this.dependencyMap.set('sale_items', ['products', 'product_units']);
    
    // Inventory dependencies
    this.dependencyMap.set('products', ['sales', 'product_units', 'barcode_registry']);
    this.dependencyMap.set('product_units', ['products', 'sales', 'sold_product_units']);
    
    // Client dependencies
    this.dependencyMap.set('clients', ['sales']);
    
    // Categories and other reference data
    this.dependencyMap.set('categories', ['products']);
    this.dependencyMap.set('brands', ['products']);

    logger.debug('CacheManager: Dependency map configured', {
      dependencies: Object.fromEntries(this.dependencyMap)
    });
  }

  /**
   * Register event listeners for automatic cache invalidation
   */
  private registerEventListeners(): void {
    // Sales events
    eventBus.subscribe(EVENT_TYPES.SALE_CREATED, this.handleSaleEvent.bind(this), 10);
    eventBus.subscribe(EVENT_TYPES.SALE_UPDATED, this.handleSaleEvent.bind(this), 10);
    eventBus.subscribe(EVENT_TYPES.SALE_DELETED, this.handleSaleEvent.bind(this), 10);

    // Inventory events
    eventBus.subscribe(EVENT_TYPES.PRODUCT_CREATED, this.handleInventoryEvent.bind(this), 10);
    eventBus.subscribe(EVENT_TYPES.PRODUCT_UPDATED, this.handleInventoryEvent.bind(this), 10);
    eventBus.subscribe(EVENT_TYPES.PRODUCT_DELETED, this.handleInventoryEvent.bind(this), 10);
    eventBus.subscribe(EVENT_TYPES.STOCK_CHANGED, this.handleInventoryEvent.bind(this), 10);
    eventBus.subscribe(EVENT_TYPES.UNIT_STATUS_CHANGED, this.handleInventoryEvent.bind(this), 10);

    // Client events
    eventBus.subscribe(EVENT_TYPES.CLIENT_CREATED, this.handleClientEvent.bind(this), 10);
    eventBus.subscribe(EVENT_TYPES.CLIENT_UPDATED, this.handleClientEvent.bind(this), 10);
    eventBus.subscribe(EVENT_TYPES.CLIENT_DELETED, this.handleClientEvent.bind(this), 10);

    logger.debug('CacheManager: Event listeners registered');
  }

  /**
   * Handle sales-related events
   */
  private async handleSaleEvent(event: ModuleEvent): Promise<void> {
    if (!this.queryClient) return;

    logger.debug('CacheManager: Handling sale event', { 
      type: event.type, 
      entityId: event.entityId 
    });

    // Invalidate sales queries
    await this.invalidateQueryKey('sales');
    
    // Invalidate related data based on sale content
    if (event.data?.sale_items) {
      await this.invalidateQueryKey('products');
      await this.invalidateQueryKey('product_units');
    }

    if (event.data?.client_id) {
      await this.invalidateQueryKey('clients');
    }
  }

  /**
   * Handle inventory-related events
   */
  private async handleInventoryEvent(event: ModuleEvent): Promise<void> {
    if (!this.queryClient) return;

    logger.debug('CacheManager: Handling inventory event', { 
      type: event.type, 
      entityId: event.entityId 
    });

    // Invalidate product queries
    await this.invalidateQueryKey('products');
    
    // For unit changes, also invalidate unit-specific queries
    if (event.type.includes('unit')) {
      await this.invalidateQueryKey('product_units');
    }

    // Stock changes affect sales validation
    if (event.type === EVENT_TYPES.STOCK_CHANGED) {
      await this.invalidateQueryKey('sales');
    }
  }

  /**
   * Handle client-related events
   */
  private async handleClientEvent(event: ModuleEvent): Promise<void> {
    if (!this.queryClient) return;

    logger.debug('CacheManager: Handling client event', { 
      type: event.type, 
      entityId: event.entityId 
    });

    // Invalidate client queries
    await this.invalidateQueryKey('clients');
    
    // If client data affects sales, invalidate sales too
    await this.invalidateQueryKey('sales');
  }

  /**
   * Intelligently invalidate cache based on query key and dependencies
   */
  async invalidateQueryKey(queryKey: string): Promise<void> {
    if (!this.queryClient) return;

    try {
      // Invalidate the primary query key
      await this.queryClient.invalidateQueries({ queryKey: [queryKey] });
      
      // Get dependent keys and invalidate them too
      const dependencies = this.dependencyMap.get(queryKey) || [];
      for (const depKey of dependencies) {
        await this.queryClient.invalidateQueries({ queryKey: [depKey] });
      }

      logger.debug('CacheManager: Invalidated queries', { 
        primaryKey: queryKey, 
        dependencies 
      });

    } catch (error) {
      logger.error('CacheManager: Error invalidating queries', error);
    }
  }

  /**
   * Force refetch specific queries for immediate updates
   */
  async refetchQueryKey(queryKey: string): Promise<void> {
    if (!this.queryClient) return;

    try {
      await this.queryClient.refetchQueries({ queryKey: [queryKey] });
      logger.debug('CacheManager: Refetched queries', { queryKey });
    } catch (error) {
      logger.error('CacheManager: Error refetching queries', error);
    }
  }

  /**
   * Optimistically update cache data
   */
  async updateCacheData<T>(
    queryKey: string[], 
    entityId: string, 
    updater: (oldData: T) => T
  ): Promise<void> {
    if (!this.queryClient) return;

    try {
      this.queryClient.setQueryData(queryKey, updater);
      
      // Also update list caches if this is a detail update
      if (queryKey.includes('detail')) {
        const listKey = [queryKey[0], 'list'];
        this.queryClient.setQueryData(listKey, (oldList: any) => {
          if (!Array.isArray(oldList)) return oldList;
          return oldList.map((item: any) => 
            item.id === entityId ? updater(item) : item
          );
        });
      }

      logger.debug('CacheManager: Updated cache optimistically', { 
        queryKey, 
        entityId 
      });

    } catch (error) {
      logger.error('CacheManager: Error updating cache optimistically', error);
    }
  }

  /**
   * Warm up frequently accessed cache entries
   */
  async warmCache(queries: Array<{ queryKey: string[]; queryFn: () => Promise<any> }>): Promise<void> {
    if (!this.queryClient) return;

    const promises = queries.map(async ({ queryKey, queryFn }) => {
      try {
        await this.queryClient!.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      } catch (error) {
        logger.error('CacheManager: Error warming cache', { queryKey, error });
      }
    });

    await Promise.allSettled(promises);
    logger.debug('CacheManager: Cache warmed', { queriesWarmed: queries.length });
  }

  /**
   * Clear all cache (for testing or reset scenarios)
   */
  async clearAll(): Promise<void> {
    if (!this.queryClient) return;

    await this.queryClient.clear();
    logger.info('CacheManager: All cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): any {
    if (!this.queryClient) return null;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
    };
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();