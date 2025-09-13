import { QueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { eventBus, EVENT_TYPES, type ModuleEvent } from './EventBus';
import { cacheManager } from './CacheManager';
import { SalesInventoryIntegrationService } from '../sales/SalesInventoryIntegrationService';

/**
 * Central data orchestrator that manages cross-module synchronization
 * and ensures data consistency across sales, inventory, and clients
 */
export class DataOrchestrator {
  private static instance: DataOrchestrator;
  private isInitialized = false;
  private validationPipeline = new Map<string, Array<(data: any) => Promise<void>>>();

  private constructor() {}

  static getInstance(): DataOrchestrator {
    if (!DataOrchestrator.instance) {
      DataOrchestrator.instance = new DataOrchestrator();
    }
    return DataOrchestrator.instance;
  }

  /**
   * Initialize the orchestrator with required dependencies
   */
  async initialize(queryClient: QueryClient): Promise<void> {
    if (this.isInitialized) return;

    // Initialize cache manager
    cacheManager.initialize(queryClient);

    // Setup validation pipelines
    this.setupValidationPipelines();

    // Register orchestration event listeners
    this.registerOrchestrationListeners();

    this.isInitialized = true;
    logger.info('DataOrchestrator: Initialized');

    // Emit initialization event
    await eventBus.emit({
      type: 'system.orchestrator_initialized',
      module: 'inventory', // Using inventory as the base module
      operation: 'create',
      entityId: 'orchestrator',
      data: { timestamp: Date.now() }
    });
  }

  /**
   * Setup validation pipelines for different operations
   */
  private setupValidationPipelines(): void {
    // Sale creation validation pipeline
    this.validationPipeline.set('sales.create', [
      this.validateSaleData.bind(this),
      this.validateInventoryAvailability.bind(this),
      this.validateClientData.bind(this),
      this.validateBusinessRules.bind(this)
    ]);

    // Product update validation pipeline
    this.validationPipeline.set('inventory.update', [
      this.validateProductUpdate.bind(this),
      this.validateStockLevels.bind(this)
    ]);

    // Client validation pipeline
    this.validationPipeline.set('clients.create', [
      this.validateClientInfo.bind(this)
    ]);

    logger.debug('DataOrchestrator: Validation pipelines configured');
  }

  /**
   * Register orchestration-specific event listeners
   */
  private registerOrchestrationListeners(): void {
    // High-priority listeners for orchestration (priority 5)
    
    // Sale events - trigger inventory synchronization
    eventBus.subscribe(EVENT_TYPES.SALE_CREATED, this.handleSaleCreated.bind(this), 5);
    eventBus.subscribe(EVENT_TYPES.SALE_UPDATED, this.handleSaleUpdated.bind(this), 5);
    eventBus.subscribe(EVENT_TYPES.SALE_DELETED, this.handleSaleDeleted.bind(this), 5);

    // Inventory events - trigger sales validation updates
    eventBus.subscribe(EVENT_TYPES.STOCK_CHANGED, this.handleStockChanged.bind(this), 5);
    eventBus.subscribe(EVENT_TYPES.UNIT_STATUS_CHANGED, this.handleUnitStatusChanged.bind(this), 5);

    // Client events - trigger sales relationship updates
    eventBus.subscribe(EVENT_TYPES.CLIENT_UPDATED, this.handleClientUpdated.bind(this), 5);
    
    // Supplier transaction events - trigger inventory updates
    eventBus.subscribe(EVENT_TYPES.SUPPLIER_TRANSACTION_ITEMS_REPLACED, this.handleSupplierTransactionItemsReplaced.bind(this), 5);

    logger.debug('DataOrchestrator: Event listeners registered');
  }

  /**
   * Pre-validation hook for operations
   */
  async validateOperation(operationType: string, data: any): Promise<void> {
    const validators = this.validationPipeline.get(operationType) || [];
    
    logger.debug('DataOrchestrator: Running validation pipeline', { 
      operationType, 
      validatorCount: validators.length 
    });

    for (const validator of validators) {
      try {
        await validator(data);
      } catch (error) {
        logger.error(`DataOrchestrator: Validation failed for ${operationType}`, error);
        
        // Emit validation error event
        await eventBus.emit({
          type: EVENT_TYPES.DATA_VALIDATION_ERROR,
          module: 'inventory', // Default module for system events
          operation: 'update',
          entityId: data.id || 'unknown',
          data: { operationType, error, validationData: data }
        });
        
        throw error;
      }
    }
  }

  /**
   * Handle sale creation - coordinate inventory updates
   */
  private async handleSaleCreated(event: ModuleEvent): Promise<void> {
    logger.info('DataOrchestrator: Handling sale creation', { 
      saleId: event.entityId, 
      correlationId: event.metadata?.correlationId 
    });

    try {
      // Emit inventory events for stock changes
      if (event.data?.sale_items) {
        for (const item of event.data.sale_items) {
          await eventBus.emit({
            type: EVENT_TYPES.STOCK_CHANGED,
            module: 'inventory',
            operation: 'update',
            entityId: item.product_id,
            data: { 
              saleId: event.entityId,
              quantityReduced: item.quantity,
              serialNumber: item.serial_number
            },
            metadata: event.metadata
          });

          // If item has serial number, mark unit as sold
          if (item.serial_number) {
            await eventBus.emit({
              type: EVENT_TYPES.UNIT_STATUS_CHANGED,
              module: 'inventory',
              operation: 'update',
              entityId: item.serial_number,
              data: { 
                productId: item.product_id,
                newStatus: 'sold',
                saleId: event.entityId
              },
              metadata: event.metadata
            });
          }
        }
      }
    } catch (error) {
      logger.error('DataOrchestrator: Error handling sale creation', error);
    }
  }

  /**
   * Handle sale updates - coordinate related changes
   */
  private async handleSaleUpdated(event: ModuleEvent): Promise<void> {
    logger.info('DataOrchestrator: Handling sale update', { 
      saleId: event.entityId,
      correlationId: event.metadata?.correlationId 
    });

    // For sale updates, we might need to adjust inventory based on item changes
    // This is a complex scenario that would require comparing old vs new items
    // For now, we'll trigger a general inventory refresh
    await eventBus.emit({
      type: EVENT_TYPES.STOCK_CHANGED,
      module: 'inventory',
      operation: 'update',
      entityId: 'bulk',
      data: { reason: 'sale_updated', saleId: event.entityId },
      metadata: event.metadata
    });
  }

  /**
   * Handle sale deletion - restore inventory
   */
  private async handleSaleDeleted(event: ModuleEvent): Promise<void> {
    logger.info('DataOrchestrator: Handling sale deletion', { 
      saleId: event.entityId,
      correlationId: event.metadata?.correlationId 
    });

    // Emit events to restore inventory
    await eventBus.emit({
      type: EVENT_TYPES.STOCK_CHANGED,
      module: 'inventory',
      operation: 'update',
      entityId: 'bulk',
      data: { reason: 'sale_deleted', saleId: event.entityId },
      metadata: event.metadata
    });
  }

  /**
   * Handle stock changes - trigger sales validation updates
   */
  private async handleStockChanged(event: ModuleEvent): Promise<void> {
    logger.debug('DataOrchestrator: Handling stock change', { 
      productId: event.entityId,
      correlationId: event.metadata?.correlationId 
    });

    // Stock changes might affect pending sales or validation
    // This is where we could trigger re-validation of pending orders
  }

  /**
   * Handle unit status changes
   */
  private async handleUnitStatusChanged(event: ModuleEvent): Promise<void> {
    logger.debug('DataOrchestrator: Handling unit status change', { 
      unitId: event.entityId,
      correlationId: event.metadata?.correlationId 
    });

    // Unit status changes affect availability for sales
  }

  /**
   * Handle client updates - check impact on sales
   */
  private async handleClientUpdated(event: ModuleEvent): Promise<void> {
    logger.debug('DataOrchestrator: Handling client update', { 
      clientId: event.entityId,
      correlationId: event.metadata?.correlationId 
    });

    // Client updates might affect sales calculations or visibility
  }

  // Validation methods
  private async validateSaleData(data: any): Promise<void> {
    if (!data.sale_items || !Array.isArray(data.sale_items)) {
      throw new Error('Sale must have items');
    }
    
    if (data.sale_items.length === 0) {
      throw new Error('Sale must have at least one item');
    }
  }

  private async validateInventoryAvailability(data: any): Promise<void> {
    // Use existing inventory integration service
    await SalesInventoryIntegrationService.validatePreSale(data);
  }

  private async validateClientData(data: any): Promise<void> {
    // Validate client exists if specified
    if (data.client_id) {
      // This would typically check if client exists and is active
      // For now, we'll assume it's valid if provided
    }
  }

  private async validateBusinessRules(data: any): Promise<void> {
    // Validate business rules like minimum order amounts, etc.
    if (data.total_amount && data.total_amount <= 0) {
      throw new Error('Sale total amount must be greater than zero');
    }
  }

  private async validateProductUpdate(data: any): Promise<void> {
    // Validate product update doesn't break constraints
    if (data.stock !== undefined && data.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }
  }

  private async validateStockLevels(data: any): Promise<void> {
    // Validate stock levels are consistent
    // This could check against pending sales, reservations, etc.
  }

  private async validateClientInfo(data: any): Promise<void> {
    // Validate client information completeness
    if (!data.first_name && !data.company_name) {
      throw new Error('Client must have either first name or company name');
    }
  }

  /**
   * Execute operation with full orchestration
   */
  async executeOperation<T>(
    operationType: string,
    operation: () => Promise<T>,
    data: any
  ): Promise<T> {
    const correlationId = `${operationType}_${Date.now()}_${Math.random()}`;
    
    logger.info('DataOrchestrator: Executing operation', { 
      operationType, 
      correlationId 
    });

    try {
      // Pre-validation
      await this.validateOperation(operationType, data);

      // Execute operation
      const result = await operation();

      logger.info('DataOrchestrator: Operation completed successfully', { 
        operationType, 
        correlationId 
      });

      return result;

    } catch (error) {
      logger.error('DataOrchestrator: Operation failed', { 
        operationType, 
        correlationId, 
        error 
      });

      // Emit error event
      await eventBus.emit({
        type: EVENT_TYPES.SYSTEM_ERROR,
        module: 'inventory',
        operation: 'update',
        entityId: data.id || 'unknown',
        data: { operationType, error, correlationId }
      });

      throw error;
    }
  }

  /**
   * Handle supplier transaction items replacement - coordinate inventory updates
   */
  private async handleSupplierTransactionItemsReplaced(event: ModuleEvent): Promise<void> {
    logger.info('DataOrchestrator: Handling supplier transaction items replacement', { 
      transactionId: event.entityId, 
      data: event.data 
    });

    try {
      // Invalidate relevant caches
      await cacheManager.invalidateQueryKey('products');
      await cacheManager.invalidateQueryKey('product-units');
      await cacheManager.invalidateQueryKey('supplier-transactions');
      
      // Update inventory for each affected product
      if (event.data?.changes) {
        for (const change of event.data.changes) {
          // Update product units if needed
          if (change.type === 'unit_update' && change.productUnitIds) {
            for (const unitId of change.productUnitIds) {
              await eventBus.emit({
                type: EVENT_TYPES.UNIT_UPDATED,
                module: 'inventory',
                operation: 'update',
                entityId: unitId,
                data: { 
                  purchasePrice: change.purchasePrice,
                  source: 'supplier_transaction_edit',
                  transactionId: event.entityId
                }
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error('DataOrchestrator: Error handling supplier transaction items replacement', error);
    }
  }

  /**
   * Get orchestrator status and statistics
   */
  getStatus(): any {
    return {
      initialized: this.isInitialized,
      validationPipelines: Array.from(this.validationPipeline.keys()),
      eventBusSubscriptions: eventBus.getSubscriptions().size,
      cacheStats: cacheManager.getCacheStats()
    };
  }
}

// Export singleton instance
export const dataOrchestrator = DataOrchestrator.getInstance();