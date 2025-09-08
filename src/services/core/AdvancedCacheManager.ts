import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { eventBus, EVENT_TYPES, type ModuleEvent } from './EventBus';

/**
 * Advanced cache optimization strategies
 */
export interface CacheOptimizationConfig {
  enablePrefetching: boolean;
  enableBatchInvalidation: boolean;
  enableOptimisticUpdates: boolean;
  enableBackgroundRefresh: boolean;
  staleTimeOverrides: Record<string, number>;
  cacheTimeOverrides: Record<string, number>;
  maxCacheSize: number;
  compressionEnabled: boolean;
}

/**
 * Cache warming strategy configuration
 */
export interface CacheWarmingStrategy {
  name: string;
  priority: number;
  triggers: string[]; // Event types that trigger this strategy
  queryKeys: string[][];
  condition?: (event: ModuleEvent) => boolean;
  warmingFn: () => Promise<void>;
  cooldownMs: number; // Minimum time between warming attempts
}

/**
 * Cache dependency relationship
 */
export interface CacheDependency {
  source: string;
  targets: string[];
  type: 'invalidate' | 'refresh' | 'optimistic_update';
  condition?: (event: ModuleEvent) => boolean;
  weight: number; // Priority weight for dependency processing
}

/**
 * Advanced cache manager with intelligent optimization strategies
 */
export class AdvancedCacheManager {
  private static instance: AdvancedCacheManager;
  private queryClient: QueryClient | null = null;
  private config: CacheOptimizationConfig;
  private dependencies = new Map<string, CacheDependency[]>();
  private warmingStrategies = new Map<string, CacheWarmingStrategy>();
  private lastWarmingAttempts = new Map<string, number>();
  private cacheStats = new Map<string, {
    hits: number;
    misses: number;
    invalidations: number;
    lastAccessed: number;
    size: number;
  }>();
  private isInitialized = false;

  private constructor() {
    this.config = {
      enablePrefetching: true,
      enableBatchInvalidation: true,
      enableOptimisticUpdates: true,
      enableBackgroundRefresh: true,
      staleTimeOverrides: {
        'products': 30000, // 30 seconds for products
        'sales': 60000, // 1 minute for sales
        'clients': 300000, // 5 minutes for clients
        'categories': 600000, // 10 minutes for categories
      },
      cacheTimeOverrides: {
        'products': 600000, // 10 minutes
        'sales': 300000, // 5 minutes
        'clients': 900000, // 15 minutes
      },
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      compressionEnabled: true
    };
  }

  static getInstance(): AdvancedCacheManager {
    if (!AdvancedCacheManager.instance) {
      AdvancedCacheManager.instance = new AdvancedCacheManager();
    }
    return AdvancedCacheManager.instance;
  }

  /**
   * Initialize with enhanced configuration
   */
  async initialize(queryClient: QueryClient, config?: Partial<CacheOptimizationConfig>): Promise<void> {
    if (this.isInitialized) return;

    this.queryClient = queryClient;
    this.config = { ...this.config, ...config };

    // Setup advanced dependencies
    this.setupAdvancedDependencies();
    
    // Setup cache warming strategies
    this.setupCacheWarmingStrategies();
    
    // Register advanced event listeners
    this.registerAdvancedEventListeners();
    
    // Setup cache optimization
    this.setupCacheOptimization();
    
    // Start background processes
    this.startBackgroundProcesses();

    this.isInitialized = true;
    logger.info('AdvancedCacheManager: Initialized with advanced optimizations');
  }

  /**
   * Setup sophisticated dependency relationships
   */
  private setupAdvancedDependencies(): void {
    // Sales dependencies with granular control
    this.addDependency('sales', {
      source: 'sales',
      targets: ['products', 'clients', 'product_units', 'inventory_stats'],
      type: 'invalidate',
      weight: 10,
      condition: (event) => event.operation === 'create' || event.operation === 'delete'
    });

    this.addDependency('sales_update', {
      source: 'sales',
      targets: ['products'],
      type: 'optimistic_update',
      weight: 8,
      condition: (event) => event.operation === 'update' && event.data?.sale_items
    });

    // Inventory dependencies with smart updates
    this.addDependency('inventory_stock', {
      source: 'products',
      targets: ['sales', 'inventory_stats', 'product_recommendations'],
      type: 'refresh',
      weight: 9,
      condition: (event) => event.data?.stock !== undefined
    });

    this.addDependency('inventory_units', {
      source: 'product_units',
      targets: ['products', 'sales'],
      type: 'optimistic_update',
      weight: 7
    });

    // Client dependencies
    this.addDependency('clients', {
      source: 'clients',
      targets: ['sales', 'client_analytics'],
      type: 'invalidate',
      weight: 6
    });

    // Category and reference data dependencies
    this.addDependency('categories', {
      source: 'categories',
      targets: ['products', 'product_recommendations'],
      type: 'refresh',
      weight: 5
    });

    logger.debug('AdvancedCacheManager: Advanced dependencies configured');
  }

  /**
   * Setup intelligent cache warming strategies
   */
  private setupCacheWarmingStrategies(): void {
    // Inventory warming strategy
    this.addWarmingStrategy({
      name: 'inventory_warming',
      priority: 10,
      triggers: [EVENT_TYPES.PRODUCT_CREATED, EVENT_TYPES.PRODUCT_UPDATED],
      queryKeys: [
        ['products', 'list'],
        ['categories'],
        ['inventory_stats']
      ],
      warmingFn: async () => {
        await this.warmInventoryCache();
      },
      cooldownMs: 30000 // 30 seconds
    });

    // Sales warming strategy
    this.addWarmingStrategy({
      name: 'sales_warming',
      priority: 9,
      triggers: [EVENT_TYPES.SALE_CREATED, EVENT_TYPES.SALE_UPDATED],
      queryKeys: [
        ['sales', 'list'],
        ['clients', 'active'],
        ['products', 'list']
      ],
      warmingFn: async () => {
        await this.warmSalesCache();
      },
      cooldownMs: 60000 // 1 minute
    });

    // Client analytics warming
    this.addWarmingStrategy({
      name: 'client_analytics_warming',
      priority: 7,
      triggers: [EVENT_TYPES.CLIENT_CREATED, EVENT_TYPES.SALE_CREATED],
      queryKeys: [
        ['client_analytics'],
        ['sales', 'stats']
      ],
      warmingFn: async () => {
        await this.warmClientAnalyticsCache();
      },
      cooldownMs: 120000 // 2 minutes
    });

    // Background refresh strategy
    this.addWarmingStrategy({
      name: 'background_refresh',
      priority: 5,
      triggers: [], // Time-based, not event-based
      queryKeys: [
        ['products', 'list'],
        ['sales', 'recent'],
        ['inventory_stats']
      ],
      warmingFn: async () => {
        await this.backgroundRefreshCriticalData();
      },
      cooldownMs: 300000 // 5 minutes
    });

    logger.debug('AdvancedCacheManager: Cache warming strategies configured');
  }

  /**
   * Register advanced event listeners with batching and optimization
   */
  private registerAdvancedEventListeners(): void {
    const batchProcessor = this.createBatchProcessor();

    // Sales events
    eventBus.subscribe(EVENT_TYPES.SALE_CREATED, (event) => batchProcessor.add('sales', event), 5);
    eventBus.subscribe(EVENT_TYPES.SALE_UPDATED, (event) => batchProcessor.add('sales', event), 5);
    eventBus.subscribe(EVENT_TYPES.SALE_DELETED, (event) => batchProcessor.add('sales', event), 5);

    // Inventory events
    eventBus.subscribe(EVENT_TYPES.PRODUCT_CREATED, (event) => batchProcessor.add('inventory', event), 5);
    eventBus.subscribe(EVENT_TYPES.PRODUCT_UPDATED, (event) => batchProcessor.add('inventory', event), 5);
    eventBus.subscribe(EVENT_TYPES.PRODUCT_DELETED, (event) => batchProcessor.add('inventory', event), 5);
    eventBus.subscribe(EVENT_TYPES.STOCK_CHANGED, (event) => batchProcessor.add('inventory', event), 5);

    // Client events
    eventBus.subscribe(EVENT_TYPES.CLIENT_CREATED, (event) => batchProcessor.add('clients', event), 5);
    eventBus.subscribe(EVENT_TYPES.CLIENT_UPDATED, (event) => batchProcessor.add('clients', event), 5);
    eventBus.subscribe(EVENT_TYPES.CLIENT_DELETED, (event) => batchProcessor.add('clients', event), 5);

    logger.debug('AdvancedCacheManager: Advanced event listeners registered');
  }

  /**
   * Create a batch processor for efficient cache operations
   */
  private createBatchProcessor() {
    const batches = new Map<string, ModuleEvent[]>();
    const timers = new Map<string, NodeJS.Timeout>();

    return {
      add: (category: string, event: ModuleEvent) => {
        if (!batches.has(category)) {
          batches.set(category, []);
        }
        
        batches.get(category)!.push(event);

        // Clear existing timer
        if (timers.has(category)) {
          clearTimeout(timers.get(category)!);
        }

        // Set new timer for batch processing
        const timer = setTimeout(async () => {
          const events = batches.get(category) || [];
          batches.delete(category);
          timers.delete(category);

          if (events.length > 0) {
            await this.processBatchedEvents(category, events);
          }
        }, 100); // 100ms batch window

        timers.set(category, timer);
      }
    };
  }

  /**
   * Process batched events efficiently
   */
  private async processBatchedEvents(category: string, events: ModuleEvent[]): Promise<void> {
    logger.debug('AdvancedCacheManager: Processing batched events', { 
      category, 
      eventCount: events.length 
    });

    try {
      if (this.config.enableBatchInvalidation) {
        // Group events by type for efficient processing
        const eventGroups = new Map<string, ModuleEvent[]>();
        
        events.forEach(event => {
          if (!eventGroups.has(event.type)) {
            eventGroups.set(event.type, []);
          }
          eventGroups.get(event.type)!.push(event);
        });

        // Process each event type efficiently
        for (const [eventType, eventList] of eventGroups) {
          await this.processEventTypeBatch(eventType, eventList);
        }
      } else {
        // Fallback to individual processing
        for (const event of events) {
          await this.processSingleEvent(event);
        }
      }

      // Trigger cache warming if appropriate
      await this.triggerCacheWarming(category, events);

    } catch (error) {
      logger.error('AdvancedCacheManager: Error processing batched events', error);
    }
  }

  /**
   * Process a batch of events of the same type
   */
  private async processEventTypeBatch(eventType: string, events: ModuleEvent[]): Promise<void> {
    const entityIds = events.map(e => e.entityId);
    const dependencies = this.getDependenciesForEventType(eventType);

    for (const dependency of dependencies) {
      if (dependency.condition && !events.some(e => dependency.condition!(e))) {
        continue;
      }

      switch (dependency.type) {
        case 'invalidate':
          await this.batchInvalidate(dependency.targets, entityIds);
          break;
        case 'refresh':
          await this.batchRefresh(dependency.targets, entityIds);
          break;
        case 'optimistic_update':
          await this.batchOptimisticUpdate(dependency.targets, events);
          break;
      }
    }
  }

  /**
   * Batch invalidate cache entries
   */
  private async batchInvalidate(targets: string[], entityIds: string[]): Promise<void> {
    if (!this.queryClient) return;

    try {
      const invalidationPromises = targets.map(async target => {
        await this.queryClient!.invalidateQueries({ queryKey: [target] });
        
        // Also invalidate specific entity queries
        for (const entityId of entityIds) {
          await this.queryClient!.invalidateQueries({ queryKey: [target, entityId] });
        }
        
        this.updateCacheStats(target, 'invalidation');
      });

      await Promise.all(invalidationPromises);
      
      logger.debug('AdvancedCacheManager: Batch invalidation completed', { 
        targets, 
        entityCount: entityIds.length 
      });

    } catch (error) {
      logger.error('AdvancedCacheManager: Batch invalidation failed', error);
    }
  }

  /**
   * Batch refresh cache entries
   */
  private async batchRefresh(targets: string[], entityIds: string[]): Promise<void> {
    if (!this.queryClient) return;

    try {
      const refreshPromises = targets.map(async target => {
        await this.queryClient!.refetchQueries({ queryKey: [target] });
        this.updateCacheStats(target, 'refresh');
      });

      await Promise.all(refreshPromises);
      
      logger.debug('AdvancedCacheManager: Batch refresh completed', { targets });

    } catch (error) {
      logger.error('AdvancedCacheManager: Batch refresh failed', error);
    }
  }

  /**
   * Batch optimistic updates
   */
  private async batchOptimisticUpdate(targets: string[], events: ModuleEvent[]): Promise<void> {
    if (!this.queryClient || !this.config.enableOptimisticUpdates) return;

    try {
      for (const target of targets) {
        for (const event of events) {
          await this.applyOptimisticUpdate(target, event);
        }
      }

      logger.debug('AdvancedCacheManager: Batch optimistic updates completed', { 
        targets, 
        eventCount: events.length 
      });

    } catch (error) {
      logger.error('AdvancedCacheManager: Batch optimistic updates failed', error);
    }
  }

  /**
   * Apply optimistic update to cache
   */
  private async applyOptimisticUpdate(target: string, event: ModuleEvent): Promise<void> {
    if (!this.queryClient) return;

    try {
      // Update specific entity cache
      if (event.operation === 'update' && event.data) {
        this.queryClient.setQueryData([target, event.entityId], (oldData: any) => {
          return oldData ? { ...oldData, ...event.data } : event.data;
        });
      }

      // Update list caches
      this.queryClient.setQueryData([target, 'list'], (oldList: any) => {
        if (!Array.isArray(oldList)) return oldList;

        switch (event.operation) {
          case 'create':
            return [...oldList, event.data];
          case 'update':
            return oldList.map((item: any) => 
              item.id === event.entityId ? { ...item, ...event.data } : item
            );
          case 'delete':
            return oldList.filter((item: any) => item.id !== event.entityId);
          default:
            return oldList;
        }
      });

      this.updateCacheStats(target, 'optimistic_update');

    } catch (error) {
      logger.error('AdvancedCacheManager: Optimistic update failed', error);
    }
  }

  /**
   * Trigger cache warming based on events
   */
  private async triggerCacheWarming(category: string, events: ModuleEvent[]): Promise<void> {
    for (const strategy of this.warmingStrategies.values()) {
      const shouldTrigger = events.some(event => 
        strategy.triggers.includes(event.type) &&
        (!strategy.condition || strategy.condition(event))
      );

      if (shouldTrigger) {
        await this.executeWarmingStrategy(strategy);
      }
    }
  }

  /**
   * Execute a cache warming strategy
   */
  private async executeWarmingStrategy(strategy: CacheWarmingStrategy): Promise<void> {
    const now = Date.now();
    const lastAttempt = this.lastWarmingAttempts.get(strategy.name) || 0;

    if (now - lastAttempt < strategy.cooldownMs) {
      logger.debug('AdvancedCacheManager: Skipping warming strategy (cooldown)', { 
        strategy: strategy.name 
      });
      return;
    }

    this.lastWarmingAttempts.set(strategy.name, now);

    try {
      await strategy.warmingFn();
      
      logger.debug('AdvancedCacheManager: Warming strategy executed', { 
        strategy: strategy.name 
      });

    } catch (error) {
      logger.error('AdvancedCacheManager: Warming strategy failed', { 
        strategy: strategy.name, 
        error 
      });
    }
  }

  /**
   * Cache warming implementations
   */
  private async warmInventoryCache(): Promise<void> {
    if (!this.queryClient) return;

    const warmingQueries = [
      { queryKey: ['products', 'list'], staleTime: 30000 },
      { queryKey: ['categories'], staleTime: 300000 },
      { queryKey: ['brands'], staleTime: 300000 },
      { queryKey: ['inventory_stats'], staleTime: 60000 }
    ];

    await this.executeWarmingQueries(warmingQueries);
  }

  private async warmSalesCache(): Promise<void> {
    if (!this.queryClient) return;

    const warmingQueries = [
      { queryKey: ['sales', 'list'], staleTime: 60000 },
      { queryKey: ['sales', 'recent'], staleTime: 30000 },
      { queryKey: ['clients', 'active'], staleTime: 300000 }
    ];

    await this.executeWarmingQueries(warmingQueries);
  }

  private async warmClientAnalyticsCache(): Promise<void> {
    if (!this.queryClient) return;

    const warmingQueries = [
      { queryKey: ['client_analytics'], staleTime: 120000 },
      { queryKey: ['sales', 'stats'], staleTime: 180000 }
    ];

    await this.executeWarmingQueries(warmingQueries);
  }

  private async backgroundRefreshCriticalData(): Promise<void> {
    if (!this.queryClient || !this.config.enableBackgroundRefresh) return;

    const criticalQueries = [
      ['products', 'list'],
      ['sales', 'recent'],
      ['inventory_stats']
    ];

    for (const queryKey of criticalQueries) {
      try {
        await this.queryClient.refetchQueries({ 
          queryKey, 
          type: 'inactive' // Only refresh if not currently being used
        });
      } catch (error) {
        logger.debug('AdvancedCacheManager: Background refresh failed for query', { 
          queryKey, 
          error 
        });
      }
    }
  }

  private async executeWarmingQueries(queries: Array<{ queryKey: string[]; staleTime: number }>): Promise<void> {
    if (!this.queryClient) return;

    const warmingPromises = queries.map(async ({ queryKey, staleTime }) => {
      try {
        await this.queryClient!.prefetchQuery({
          queryKey,
          staleTime,
          // Use a dummy query function - in practice this would call actual API
          queryFn: () => Promise.resolve([])
        });
      } catch (error) {
        logger.debug('AdvancedCacheManager: Query warming failed', { queryKey, error });
      }
    });

    await Promise.allSettled(warmingPromises);
  }

  /**
   * Setup cache optimization with custom configurations
   */
  private setupCacheOptimization(): void {
    if (!this.queryClient) return;

    // Apply stale time overrides
    const defaultOptions = this.queryClient.getDefaultOptions();
    
    // Enhance default options with our optimizations
    this.queryClient.setDefaultOptions({
      ...defaultOptions,
      queries: {
        ...defaultOptions.queries,
        staleTime: 5 * 60 * 1000, // 5 minutes default
        gcTime: 10 * 60 * 1000, // 10 minutes default (replaces cacheTime)
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          // Intelligent retry logic
          if (failureCount >= 3) return false;
          if ((error as any)?.status === 404) return false;
          return true;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
      }
    });

    logger.debug('AdvancedCacheManager: Cache optimization configured');
  }

  /**
   * Start background processes
   */
  private startBackgroundProcesses(): void {
    // Cache cleanup process
    setInterval(() => {
      this.performCacheCleanup();
    }, 300000); // 5 minutes

    // Cache statistics collection
    setInterval(() => {
      this.collectCacheStatistics();
    }, 60000); // 1 minute

    // Background warming process
    if (this.config.enableBackgroundRefresh) {
      setInterval(() => {
        const strategy = this.warmingStrategies.get('background_refresh');
        if (strategy) {
          this.executeWarmingStrategy(strategy);
        }
      }, 300000); // 5 minutes
    }

    logger.debug('AdvancedCacheManager: Background processes started');
  }

  /**
   * Utility methods
   */
  private addDependency(name: string, dependency: CacheDependency): void {
    if (!this.dependencies.has(dependency.source)) {
      this.dependencies.set(dependency.source, []);
    }
    this.dependencies.get(dependency.source)!.push(dependency);
  }

  private addWarmingStrategy(strategy: CacheWarmingStrategy): void {
    this.warmingStrategies.set(strategy.name, strategy);
  }

  private getDependenciesForEventType(eventType: string): CacheDependency[] {
    const allDependencies: CacheDependency[] = [];
    
    for (const dependencies of this.dependencies.values()) {
      allDependencies.push(...dependencies);
    }

    return allDependencies
      .filter(dep => eventType.includes(dep.source))
      .sort((a, b) => b.weight - a.weight);
  }

  private async processSingleEvent(event: ModuleEvent): Promise<void> {
    // Fallback to individual event processing
    const dependencies = this.getDependenciesForEventType(event.type);
    
    for (const dependency of dependencies) {
      if (dependency.condition && !dependency.condition(event)) {
        continue;
      }

      await this.processEventTypeBatch(event.type, [event]);
    }
  }

  private updateCacheStats(target: string, operation: string): void {
    if (!this.cacheStats.has(target)) {
      this.cacheStats.set(target, {
        hits: 0,
        misses: 0,
        invalidations: 0,
        lastAccessed: Date.now(),
        size: 0
      });
    }

    const stats = this.cacheStats.get(target)!;
    stats.lastAccessed = Date.now();

    switch (operation) {
      case 'hit':
        stats.hits++;
        break;
      case 'miss':
        stats.misses++;
        break;
      case 'invalidation':
      case 'refresh':
      case 'optimistic_update':
        stats.invalidations++;
        break;
    }
  }

  private performCacheCleanup(): void {
    if (!this.queryClient) return;

    try {
      // Get all queries and their data
      const cache = this.queryClient.getQueryCache();
      const queries = cache.getAll();
      
      // Calculate total cache size (approximate)
      let totalSize = 0;
      const queryDates = new Map<string, number>();

      queries.forEach(query => {
        const dataSize = JSON.stringify(query.state.data || {}).length;
        totalSize += dataSize;
        queryDates.set(query.queryHash, query.state.dataUpdatedAt);
      });

      // If cache is too large, remove oldest entries
      if (totalSize > this.config.maxCacheSize) {
        const sortedQueries = Array.from(queryDates.entries())
          .sort((a, b) => a[1] - b[1]) // Sort by oldest first
          .slice(0, Math.floor(queries.length * 0.2)); // Remove oldest 20%

        sortedQueries.forEach(([queryHash]) => {
          const query = cache.get(queryHash);
          if (query) {
            cache.remove(query);
          }
        });

        logger.debug('AdvancedCacheManager: Cache cleanup performed', {
          removedQueries: sortedQueries.length,
          oldSize: totalSize,
          newSize: totalSize * 0.8 // Approximate
        });
      }

    } catch (error) {
      logger.error('AdvancedCacheManager: Cache cleanup failed', error);
    }
  }

  private collectCacheStatistics(): void {
    if (!this.queryClient) return;

    try {
      const cache = this.queryClient.getQueryCache();
      const queries = cache.getAll();

      const stats = {
        totalQueries: queries.length,
        staleQueries: queries.filter(q => q.isStale()).length,
        fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
        errorQueries: queries.filter(q => q.state.status === 'error').length,
        cacheHitRatio: this.calculateCacheHitRatio(),
        averageResponseTime: this.calculateAverageResponseTime(),
        memoryUsage: this.estimateMemoryUsage(queries)
      };

      // Store statistics for monitoring
      this.queryClient.setQueryData(['cache_statistics'], stats);

      logger.debug('AdvancedCacheManager: Cache statistics collected', stats);

    } catch (error) {
      logger.error('AdvancedCacheManager: Statistics collection failed', error);
    }
  }

  private calculateCacheHitRatio(): number {
    let totalHits = 0;
    let totalRequests = 0;

    for (const stats of this.cacheStats.values()) {
      totalHits += stats.hits;
      totalRequests += stats.hits + stats.misses;
    }

    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  private calculateAverageResponseTime(): number {
    // This would be implemented with actual timing data
    // For now, return a placeholder
    return 150; // milliseconds
  }

  private estimateMemoryUsage(queries: any[]): number {
    let totalSize = 0;
    
    queries.forEach(query => {
      try {
        const dataStr = JSON.stringify(query.state.data || {});
        totalSize += dataStr.length * 2; // Rough estimate (UTF-16)
      } catch (error) {
        // Ignore circular reference errors
      }
    });

    return totalSize;
  }

  /**
   * Public API methods
   */
  
  /**
   * Manually trigger cache warming for specific categories
   */
  async warmCache(categories: string[] = []): Promise<void> {
    if (categories.length === 0) {
      // Warm all strategies
      for (const strategy of this.warmingStrategies.values()) {
        await this.executeWarmingStrategy(strategy);
      }
    } else {
      // Warm specific categories
      for (const category of categories) {
        const strategy = this.warmingStrategies.get(`${category}_warming`);
        if (strategy) {
          await this.executeWarmingStrategy(strategy);
        }
      }
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getCacheStatistics(): any {
    if (!this.queryClient) return null;

    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      overview: {
        totalQueries: queries.length,
        staleQueries: queries.filter(q => q.isStale()).length,
        fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
        errorQueries: queries.filter(q => q.state.status === 'error').length,
      },
      performance: {
        hitRatio: this.calculateCacheHitRatio(),
        averageResponseTime: this.calculateAverageResponseTime(),
        memoryUsage: this.estimateMemoryUsage(queries),
      },
      dependencies: Array.from(this.dependencies.entries()),
      warmingStrategies: Array.from(this.warmingStrategies.keys()),
      config: this.config
    };
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<CacheOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.queryClient) {
      this.setupCacheOptimization();
    }
    
    logger.info('AdvancedCacheManager: Configuration updated', config);
  }

  /**
   * Force cache refresh for specific keys
   */
  async forceRefresh(queryKeys: string[][]): Promise<void> {
    if (!this.queryClient) return;

    const refreshPromises = queryKeys.map(queryKey => 
      this.queryClient!.refetchQueries({ queryKey })
    );

    await Promise.all(refreshPromises);
    logger.debug('AdvancedCacheManager: Force refresh completed', { queryKeys });
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    if (!this.queryClient) return;

    await this.queryClient.clear();
    this.cacheStats.clear();
    this.lastWarmingAttempts.clear();
    
    logger.info('AdvancedCacheManager: All cache cleared');
  }

  /**
   * Invalidate queries by pattern
   */
  async invalidateByPattern(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    const keys = Array.from(this.queryClient?.getQueryCache().getAll() || [])
      .filter(query => {
        const queryKey = Array.isArray(query.queryKey) ? query.queryKey.join('/') : String(query.queryKey);
        return queryKey.includes(pattern);
      })
      .map(query => query.queryKey);

    await Promise.all(keys.map(key => this.queryClient?.invalidateQueries({ queryKey: key })));
  }
}

// Export singleton instance
export const advancedCacheManager = AdvancedCacheManager.getInstance();