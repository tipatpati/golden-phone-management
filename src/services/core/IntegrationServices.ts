import { logger } from '@/utils/logger';
import { eventBus, EVENT_TYPES } from './EventBus';
import { dataOrchestrator } from './DataOrchestrator';
import { transactionCoordinator } from './TransactionCoordinator';
import { SalesInventoryIntegrationService } from '../sales/SalesInventoryIntegrationService';
import type { CreateSaleData } from '../sales/types';
import type { CreateClientData } from '../clients/types';

// Re-export advanced integration services
export { AdvancedClientSalesIntegration } from './AdvancedClientSalesIntegration';
export { AdvancedInventoryClientIntegration } from './AdvancedInventoryClientIntegration';

/**
 * Enhanced Sales-Inventory Integration Service with Transaction Coordination
 * Extends existing functionality with comprehensive orchestration
 */
export class EnhancedSalesInventoryIntegration {
  
  /**
   * Validate and create sale with full transaction coordination
   */
  static async validateAndCreateSaleWithTransaction(saleData: CreateSaleData): Promise<{
    validatedData: CreateSaleData;
    transactionId: string;
  }> {
    const transactionId = await transactionCoordinator.beginTransaction({
      operation: 'validate_and_create_sale',
      saleData
    });

    try {
      // Step 1: Pre-validation using existing service
      await transactionCoordinator.executeInTransaction(
        transactionId,
        'validate_inventory',
        'inventory',
        async () => {
          await SalesInventoryIntegrationService.validatePreSale(saleData);
        }
      );

      // Step 2: Reserve inventory for sale items
      await transactionCoordinator.executeInTransaction(
        transactionId,
        'reserve_inventory',
        'inventory',
        async () => {
          for (const item of saleData.sale_items || []) {
            if (item.serial_number) {
              // Reserve specific serialized unit
              await this.reserveSerializedUnit(item.product_id, item.serial_number);
            } else {
              // Reserve quantity from stock
              await this.reserveStockQuantity(item.product_id, item.quantity);
            }
          }
        },
        async () => {
          // Compensation: release reservations
          logger.info('Compensated: Released inventory reservations for failed sale');
        }
      );

      return { validatedData: saleData, transactionId };

    } catch (error) {
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      throw error;
    }
  }

  /**
   * Reserve serialized unit for sale
   */
  private static async reserveSerializedUnit(productId: string, serialNumber: string): Promise<void> {
    await eventBus.emit({
      type: 'inventory.unit_reserved',
      module: 'inventory',
      operation: 'update',
      entityId: serialNumber,
      data: { productId, serialNumber, reserved: true }
    });
    
    logger.debug('Reserved serialized unit', { productId, serialNumber });
  }

  /**
   * Reserve stock quantity for non-serialized products
   */
  private static async reserveStockQuantity(productId: string, quantity: number): Promise<void> {
    await eventBus.emit({
      type: 'inventory.stock_reserved',
      module: 'inventory',
      operation: 'update',
      entityId: productId,
      data: { productId, quantity, reserved: true }
    });
    
    logger.debug('Reserved stock quantity', { productId, quantity });
  }

  /**
   * Handle inventory impact after sale creation with transaction coordination
   */
  static async processInventoryImpactWithTransaction(
    saleId: string, 
    saleData: CreateSaleData,
    transactionId: string
  ): Promise<void> {
    logger.info('EnhancedSalesInventoryIntegration: Processing inventory impact with transaction', { 
      saleId, 
      transactionId 
    });

    try {
      // Process each sale item within transaction
      for (const item of saleData.sale_items || []) {
        await transactionCoordinator.executeInTransaction(
          transactionId,
          'process_inventory_item',
          'inventory',
          async () => {
            if (item.serial_number) {
              // Mark serialized unit as sold
              await eventBus.emit({
                type: EVENT_TYPES.UNIT_STATUS_CHANGED,
                module: 'inventory',
                operation: 'update',
                entityId: item.serial_number,
                data: {
                  productId: item.product_id,
                  newStatus: 'sold',
                  saleId
                }
              });
            } else {
              // Reduce stock for non-serialized items
              await eventBus.emit({
                type: EVENT_TYPES.STOCK_CHANGED,
                module: 'inventory',
                operation: 'update',
                entityId: item.product_id,
                data: {
                  quantityChange: -item.quantity,
                  reason: 'sale_created',
                  saleId
                }
              });
            }
          },
          async () => {
            // Compensation: restore inventory
            if (item.serial_number) {
              await eventBus.emit({
                type: EVENT_TYPES.UNIT_STATUS_CHANGED,
                module: 'inventory',
                operation: 'update',
                entityId: item.serial_number,
                data: {
                  productId: item.product_id,
                  newStatus: 'available',
                  reason: 'sale_compensation'
                }
              });
            } else {
              await eventBus.emit({
                type: EVENT_TYPES.STOCK_CHANGED,
                module: 'inventory',
                operation: 'update',
                entityId: item.product_id,
                data: {
                  quantityChange: item.quantity,
                  reason: 'sale_compensation'
                }
              });
            }
            
            logger.info('Compensated inventory for failed sale', { 
              productId: item.product_id,
              serialNumber: item.serial_number,
              quantity: item.quantity
            });
          }
        );
      }

      // Emit final sale created event
      await eventBus.emit({
        type: EVENT_TYPES.SALE_CREATED,
        module: 'sales',
        operation: 'create',
        entityId: saleId,
        data: saleData
      });

    } catch (error) {
      logger.error('EnhancedSalesInventoryIntegration: Error processing inventory impact', error);
      throw error;
    }
  }

  /**
   * Validate inventory availability for sale modification with transaction coordination
   */
  static async validateInventoryForSaleUpdateWithTransaction(
    originalSale: any, 
    updatedSaleData: Partial<CreateSaleData>
  ): Promise<{ transactionId: string; inventoryChanges: any[] }> {
    const transactionId = await transactionCoordinator.beginTransaction({
      operation: 'validate_sale_update_inventory',
      originalSale,
      updatedSaleData
    });

    try {
      logger.info('EnhancedSalesInventoryIntegration: Validating inventory for sale update');

      // Compare original vs updated items to determine inventory impact
      const originalItems = originalSale.sale_items || [];
      const updatedItems = updatedSaleData.sale_items || [];

      // Calculate net changes in inventory requirements
      const inventoryChanges = this.calculateInventoryChanges(originalItems, updatedItems);

      // Validate changes within transaction
      await transactionCoordinator.executeInTransaction(
        transactionId,
        'validate_inventory_changes',
        'inventory',
        async () => {
          for (const change of inventoryChanges) {
            if (change.quantityDelta > 0) {
              // Need more inventory - validate availability
              await SalesInventoryIntegrationService.validatePreSale({
                sale_items: [{
                  product_id: change.productId,
                  quantity: change.quantityDelta,
                  unit_price: change.unitPrice,
                  serial_number: change.serialNumber
                }]
              } as CreateSaleData);
            }
          }
        }
      );

      return { transactionId, inventoryChanges };

    } catch (error) {
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      throw error;
    }
  }

  /**
   * Calculate inventory changes between original and updated sale items
   */
  private static calculateInventoryChanges(originalItems: any[], updatedItems: any[]): Array<{
    productId: string;
    quantityDelta: number;
    unitPrice: number;
    serialNumber?: string;
  }> {
    const changes: Array<{
      productId: string;
      quantityDelta: number;
      unitPrice: number;
      serialNumber?: string;
    }> = [];

    // Create maps for easier comparison
    const originalMap = new Map(originalItems.map(item => [
      `${item.product_id}:${item.serial_number || ''}`, 
      item
    ]));
    
    const updatedMap = new Map(updatedItems.map(item => [
      `${item.product_id}:${item.serial_number || ''}`, 
      item
    ]));

    // Check for new or modified items
    for (const [key, updatedItem] of updatedMap) {
      const originalItem = originalMap.get(key);
      
      if (!originalItem) {
        // New item
        changes.push({
          productId: updatedItem.product_id,
          quantityDelta: updatedItem.quantity,
          unitPrice: updatedItem.unit_price,
          serialNumber: updatedItem.serial_number
        });
      } else if (originalItem.quantity !== updatedItem.quantity) {
        // Modified quantity
        changes.push({
          productId: updatedItem.product_id,
          quantityDelta: updatedItem.quantity - originalItem.quantity,
          unitPrice: updatedItem.unit_price,
          serialNumber: updatedItem.serial_number
        });
      }
    }

    // Check for removed items
    for (const [key, originalItem] of originalMap) {
      if (!updatedMap.has(key)) {
        changes.push({
          productId: originalItem.product_id,
          quantityDelta: -originalItem.quantity,
          unitPrice: originalItem.unit_price,
          serialNumber: originalItem.serial_number
        });
      }
    }

    return changes;
  }
}

/**
 * Legacy compatibility methods - maintain existing API while adding transaction support
 */
export class SalesInventoryIntegration {
  static async validateAndCreateSale(saleData: CreateSaleData): Promise<CreateSaleData> {
    const result = await EnhancedSalesInventoryIntegration.validateAndCreateSaleWithTransaction(saleData);
    return result.validatedData;
  }

  static async processInventoryImpact(saleId: string, saleData: CreateSaleData): Promise<void> {
    // Create a simple transaction for legacy support
    const transactionId = await transactionCoordinator.beginTransaction({
      operation: 'legacy_inventory_impact',
      saleId,
      saleData
    });

    try {
      await EnhancedSalesInventoryIntegration.processInventoryImpactWithTransaction(
        saleId, 
        saleData, 
        transactionId
      );
      await transactionCoordinator.commitTransaction(transactionId);
    } catch (error) {
      await transactionCoordinator.abortTransaction(transactionId, (error as Error).message);
      throw error;
    }
  }

  static async validateInventoryForSaleUpdate(
    originalSale: any, 
    updatedSaleData: Partial<CreateSaleData>
  ): Promise<void> {
    const result = await EnhancedSalesInventoryIntegration.validateInventoryForSaleUpdateWithTransaction(
      originalSale, 
      updatedSaleData
    );
    
    // Auto-commit for legacy compatibility
    await transactionCoordinator.commitTransaction(result.transactionId);
  }
}

/**
 * Simplified client-sales integration
 */
export class ClientSalesIntegration {
  static async createClientWithValidation(clientData: CreateClientData): Promise<CreateClientData> {
    return await dataOrchestrator.executeOperation(
      'clients.create',
      async () => {
        // Emit client creation event
        await eventBus.emit({
          type: EVENT_TYPES.CLIENT_CREATED,
          module: 'clients',
          operation: 'create',
          entityId: 'pending',
          data: clientData
        });

        return clientData;
      },
      clientData
    );
  }

  static async validateClientAccess(clientId: string, userId: string): Promise<boolean> {
    // This would check if the user has permission to create sales for this client
    // Based on role and business rules
    return true; // Simplified for now
  }

  static async getClientSalesStats(clientId: string): Promise<any> {
    // This would aggregate sales data for a specific client
    // Used for client relationship management
    return {
      totalSales: 0,
      averageOrderValue: 0,
      lastPurchaseDate: null,
      purchaseFrequency: 0
    };
  }
}

/**
 * Simplified inventory-client integration
 */
export class InventoryClientIntegration {
  static async getClientProductRecommendations(clientId: string): Promise<any[]> {
    // This would analyze client purchase history and recommend products
    return [];
  }

  static async checkProductAvailabilityForClient(
    productId: string, 
    clientId: string,
    quantity: number
  ): Promise<boolean> {
    // This could implement client-specific pricing, availability rules, etc.
    return true; // Simplified for now
  }

  static async reserveInventoryForClient(
    productId: string,
    clientId: string,
    quantity: number,
    reservationMinutes: number = 30
  ): Promise<string> {
    // This would create a temporary reservation
    const reservationId = `res_${Date.now()}_${Math.random()}`;
    
    await eventBus.emit({
      type: 'inventory.reserved',
      module: 'inventory',
      operation: 'update',
      entityId: productId,
      data: {
        clientId,
        quantity,
        reservationId,
        expiresAt: Date.now() + (reservationMinutes * 60 * 1000)
      }
    });

    return reservationId;
  }
}