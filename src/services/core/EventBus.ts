import { logger } from '@/utils/logger';

export interface SystemEvent {
  type: string;
  module: 'sales' | 'inventory' | 'clients' | 'suppliers' | 'consistency' | 'conflict_resolution' | 'ui';
  operation: 'create' | 'update' | 'delete' | 'check' | 'resolve' | 'violation' | 'notification';
  entityId: string;
  data?: any;
  metadata?: {
    userId?: string;
    timestamp: number;
    correlationId?: string;
  };
}

// For compatibility with ModuleEvent
export type ModuleEvent = SystemEvent;

// Event listener function type
export type EventListener = (event: SystemEvent) => void | Promise<void>;

// Event subscription type
export interface EventSubscription {
  id: string;
  eventType: string;
  listener: EventListener;
  priority: number; // Lower number = higher priority
}

/**
 * Central event bus for cross-module communication
 * Enables decoupled synchronization between sales, inventory, and clients
 */
export class EventBus {
  private static instance: EventBus;
  private subscriptions = new Map<string, EventSubscription[]>();
  private listeners = new Map<string, Array<(event: any) => void>>();
  private processingQueue: SystemEvent[] = [];
  private isProcessing = false;
  private logger = logger;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe(eventType: string, listener: EventListener, priority: number = 100): string {
    const subscriptionId = `${eventType}_${Date.now()}_${Math.random()}`;
    
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      listener,
      priority
    };

    const eventSubscriptions = this.subscriptions.get(eventType)!;
    eventSubscriptions.push(subscription);
    
    // Sort by priority (lower number = higher priority)
    eventSubscriptions.sort((a, b) => a.priority - b.priority);

    logger.debug(`EventBus: Subscribed to ${eventType}`, { subscriptionId, priority });
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index >= 0) {
        subscriptions.splice(index, 1);
        logger.debug(`EventBus: Unsubscribed from ${eventType}`, { subscriptionId });
        return;
      }
    }
  }

  /**
   * Emit an event to all subscribers
   */
  async emit(event: SystemEvent): Promise<void> {
    // Add metadata if not present
    if (!event.metadata) {
      event.metadata = {
        timestamp: Date.now(),
        correlationId: `${event.module}_${event.operation}_${Date.now()}`
      };
    }

    this.logger.info(`EventBus: Emitting event ${event.type}`, {
      module: event.module,
      operation: event.operation,
      entityId: event.entityId,
      correlationId: event.metadata.correlationId
    });

    // Emit to both old and new style listeners
    const listeners = this.listeners.get(event.type) || [];
    const promises = listeners.map(listener => {
      try {
        return listener(event);
      } catch (error) {
        this.logger.error(`EventBus: Error in listener for ${event.type}`, error);
        return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);

    // Add to processing queue for subscriptions
    this.processingQueue.push(event);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  on(eventType: string, listener: (event: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }

  off(eventType: string, listener: (event: any) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Process events in queue sequentially to maintain order
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      while (this.processingQueue.length > 0) {
        const event = this.processingQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      logger.error('EventBus: Error processing queue', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: SystemEvent): Promise<void> {
    const subscriptions = this.subscriptions.get(event.type) || [];
    const errors: Array<{ subscriptionId: string; error: any }> = [];

    // Execute all listeners (already sorted by priority)
    for (const subscription of subscriptions) {
      try {
        await subscription.listener(event);
      } catch (error) {
        logger.error(`EventBus: Error in listener ${subscription.id}`, error);
        errors.push({ subscriptionId: subscription.id, error });
      }
    }

    // Log completion
    logger.debug(`EventBus: Processed event ${event.type}`, {
      listenersExecuted: subscriptions.length,
      errors: errors.length,
      correlationId: event.metadata?.correlationId
    });

    // If there were errors, emit an error event
    if (errors.length > 0) {
      const errorEvent: SystemEvent = {
        type: 'system.event_processing_error',
        module: event.module,
        operation: 'update',
        entityId: event.entityId,
        data: { originalEvent: event, errors },
        metadata: {
          timestamp: Date.now(),
          correlationId: event.metadata?.correlationId
        }
      };
      
      // Don't await this to prevent infinite recursion
      setTimeout(() => this.emit(errorEvent), 0);
    }
  }

  /**
   * Get all active subscriptions (for debugging)
   */
  getSubscriptions(): Map<string, EventSubscription[]> {
    return new Map(this.subscriptions);
  }

  /**
   * Clear all subscriptions (for testing)
   */
  clearAll(): void {
    this.subscriptions.clear();
    this.processingQueue = [];
    this.isProcessing = false;
    logger.debug('EventBus: Cleared all subscriptions');
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Event type constants
export const EVENT_TYPES = {
  // Sales events
  SALE_CREATED: 'sales.created',
  SALE_UPDATED: 'sales.updated',
  SALE_DELETED: 'sales.deleted',
  SALE_ITEM_ADDED: 'sales.item_added',
  SALE_ITEM_REMOVED: 'sales.item_removed',
  
  // Inventory events
  PRODUCT_CREATED: 'inventory.product_created',
  PRODUCT_UPDATED: 'inventory.product_updated',
  PRODUCT_DELETED: 'inventory.product_deleted',
  STOCK_CHANGED: 'inventory.stock_changed',
  UNIT_STATUS_CHANGED: 'inventory.unit_status_changed',
  UNIT_CREATED: 'inventory.unit_created',
  UNIT_UPDATED: 'inventory.unit_updated',
  UNIT_DELETED: 'inventory.unit_deleted',
  
  // Supplier events
  SUPPLIER_CREATED: 'suppliers.created',
  SUPPLIER_UPDATED: 'suppliers.updated',
  SUPPLIER_DELETED: 'suppliers.deleted',
  SUPPLIER_TRANSACTION_CREATED: 'suppliers.transaction_created',
  SUPPLIER_TRANSACTION_UPDATED: 'suppliers.transaction_updated',
  SUPPLIER_TRANSACTION_DELETED: 'suppliers.transaction_deleted',
  SUPPLIER_TRANSACTION_ITEMS_REPLACED: 'suppliers.transaction_items_replaced',
  
  // Client events
  CLIENT_CREATED: 'clients.created',
  CLIENT_UPDATED: 'clients.updated',
  CLIENT_DELETED: 'clients.deleted',
  
  // Brand events
  BRAND_CREATED: 'brands.created',
  BRAND_UPDATED: 'brands.updated',
  BRAND_DELETED: 'brands.deleted',
  
  // Employee events
  EMPLOYEE_CREATED: 'employees.created',
  EMPLOYEE_UPDATED: 'employees.updated',
  EMPLOYEE_DELETED: 'employees.deleted',
  
  // Repair events
  REPAIR_CREATED: 'repairs.created',
  REPAIR_UPDATED: 'repairs.updated',
  REPAIR_DELETED: 'repairs.deleted',
  
  // System events
  SYSTEM_ERROR: 'system.error',
  CACHE_INVALIDATED: 'system.cache_invalidated',
  DATA_VALIDATION_ERROR: 'system.validation_error'
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];