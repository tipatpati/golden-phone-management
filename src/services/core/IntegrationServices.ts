import { logger } from '@/utils/logger';
import { eventBus, EVENT_TYPES } from './EventBus';
import { dataOrchestrator } from './DataOrchestrator';
import { SalesInventoryIntegrationService } from '../sales/SalesInventoryIntegrationService';
import type { CreateSaleData } from '../sales/types';
import type { CreateClientData } from '../clients/types';

/**
 * Enhanced integration services that coordinate operations across modules
 * using the orchestration layer for data consistency
 */

/**
 * Sales-Inventory Integration Service
 * Extends existing functionality with orchestration
 */
export class EnhancedSalesInventoryIntegration {
  
  /**
   * Validate and create sale with full orchestration
   */
  static async validateAndCreateSale(saleData: CreateSaleData): Promise<CreateSaleData> {
    return await dataOrchestrator.executeOperation(
      'sales.create',
      async () => {
        // Pre-validation using existing service
        await SalesInventoryIntegrationService.validatePreSale(saleData);
        
        // Emit pre-creation event
        await eventBus.emit({
          type: 'sales.pre_create',
          module: 'sales',
          operation: 'create',
          entityId: 'pending',
          data: saleData
        });

        return saleData;
      },
      saleData
    );
  }

  /**
   * Handle inventory impact after sale creation
   */
  static async processInventoryImpact(saleId: string, saleData: CreateSaleData): Promise<void> {
    logger.info('EnhancedSalesInventoryIntegration: Processing inventory impact', { saleId });

    try {
      // Emit sale created event to trigger inventory updates
      await eventBus.emit({
        type: EVENT_TYPES.SALE_CREATED,
        module: 'sales',
        operation: 'create',
        entityId: saleId,
        data: saleData
      });

      // Process each sale item for inventory adjustments
      for (const item of saleData.sale_items || []) {
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
      }

    } catch (error) {
      logger.error('EnhancedSalesInventoryIntegration: Error processing inventory impact', error);
      throw error;
    }
  }

  /**
   * Validate inventory availability for sale modification
   */
  static async validateInventoryForSaleUpdate(
    originalSale: any, 
    updatedSaleData: Partial<CreateSaleData>
  ): Promise<void> {
    logger.info('EnhancedSalesInventoryIntegration: Validating inventory for sale update');

    // Compare original vs updated items to determine inventory impact
    const originalItems = originalSale.sale_items || [];
    const updatedItems = updatedSaleData.sale_items || [];

    // Calculate net changes in inventory requirements
    const inventoryChanges = this.calculateInventoryChanges(originalItems, updatedItems);

    // Validate that the changes are feasible
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
 * Client-Sales Integration Service
 */
class ClientSalesIntegrationClass {
  
  /**
   * Create client with sales relationship validation
   */
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

  /**
   * Validate client access for sales operations
   */
  static async validateClientAccess(clientId: string, userId: string): Promise<boolean> {
    // This would check if the user has permission to create sales for this client
    // Based on role and business rules
    return true; // Simplified for now
  }

  /**
   * Get client sales statistics
   */
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
 * Inventory-Client Integration Service
 */
class InventoryClientIntegrationClass {
  
  /**
   * Get client-specific product recommendations
   */
  static async getClientProductRecommendations(clientId: string): Promise<any[]> {
    // This would analyze client purchase history and recommend products
    return [];
  }

  /**
   * Check product availability for specific client
   */
  static async checkProductAvailabilityForClient(
    productId: string, 
    clientId: string,
    quantity: number
  ): Promise<boolean> {
    // This could implement client-specific pricing, availability rules, etc.
    return true; // Simplified for now
  }

  /**
   * Reserve inventory for client
   */
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

// Export all integration services
export const SalesInventoryIntegration = EnhancedSalesInventoryIntegration;
export const ClientSalesIntegration = ClientSalesIntegrationClass;
export const InventoryClientIntegration = InventoryClientIntegrationClass;