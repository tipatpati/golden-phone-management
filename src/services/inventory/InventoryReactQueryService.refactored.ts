/**
 * REFACTORED INVENTORY REACT QUERY SERVICE
 * Uses unified CRUD operations for consistency and data integrity
 */

import { createCRUDMutations } from '../core/UnifiedCRUDService';
import { TransactionManager, type TransactionStep } from '../core/TransactionManager';
import { InventoryManagementService } from './InventoryManagementService';
import { ProductUnitManagementService } from '../shared/ProductUnitManagementService';
import { useOptimizedQuery } from '@/hooks/useAdvancedCaching';
import { EVENT_TYPES } from '../core/EventBus';
import type { Product, CreateProductData, ProductFormData, InventorySearchFilters, UnitEntryForm } from './types';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// ==========================================
// QUERY HOOKS (Read Operations)
// ==========================================

export const useProducts = (filters?: InventorySearchFilters) => {
  return useOptimizedQuery(
    ['products', 'list', JSON.stringify(filters || {})],
    () => InventoryManagementService.getProducts(filters || {}),
    {
      priority: 'high',
      enablePrefetching: true,
      enableOptimisticUpdates: true,
      cacheTags: ['dynamic', 'inventory'],
      dependencies: ['categories', 'brands']
    }
  );
};

export const useProduct = (id: string) => {
  return useOptimizedQuery(
    ['products', 'detail', id],
    async () => {
      const { productUnitCoordinator } = await import('@/services/shared/ProductUnitCoordinator');
      const result = await productUnitCoordinator.getProductWithUnits(id);
      
      if (!result.product) return null;
      
      return {
        ...result.product,
        units: result.units,
        unit_entries: result.unitEntries
      };
    },
    {
      priority: 'normal',
      enablePrefetching: false,
      enableOptimisticUpdates: true,
      cacheTags: ['realtime', 'inventory']
    }
  );
};

// ==========================================
// MUTATION HOOKS (Write Operations)
// ==========================================

const productCRUD = createCRUDMutations<Product, CreateProductData>(
  {
    entityName: 'inventory',
    queryKey: 'products',
    eventTypes: {
      created: EVENT_TYPES.PRODUCT_CREATED,
      updated: EVENT_TYPES.PRODUCT_UPDATED,
      deleted: EVENT_TYPES.PRODUCT_DELETED
    },
    relatedQueries: ['categories', 'brands']
  },
  {
    create: (data) => InventoryManagementService.createProduct(data as any),
    update: (id, data) => InventoryManagementService.updateProduct(id, data),
    delete: (id) => InventoryManagementService.deleteProduct(id)
  }
);

/**
 * CREATE product with transactional unit creation
 */
export const useCreateProduct = () => {
  const baseCreate = productCRUD.useCreate();

  return {
    ...baseCreate,
    mutateAsync: async (productData: ProductFormData) => {
      logger.info('Creating product with units', { 
        hasSerial: productData.has_serial, 
        unitCount: productData.unit_entries?.length 
      }, 'InventoryService');

      const steps: TransactionStep[] = [];
      let createdProductId: string | null = null;

      // Step 1: Create product
      steps.push({
        name: 'create_product',
        execute: async () => {
          const product = await baseCreate.mutateAsync({
            brand: productData.brand,
            model: productData.model,
            year: productData.year,
            category_id: productData.category_id,
            price: productData.price,
            min_price: productData.min_price,
            max_price: productData.max_price,
            stock: productData.stock || 0,
            threshold: productData.threshold || 0,
            description: productData.description,
            supplier: productData.supplier,
            barcode: productData.barcode,
            has_serial: productData.has_serial,
            status: 'active',
            store_id: productData.store_id
          });
          createdProductId = product.id;
          return product;
        },
        rollback: async (product) => {
          if (product?.id) {
            await InventoryManagementService.deleteProduct(product.id);
          }
        }
      });

      // Step 2: Create units if has serial
      if (productData.has_serial && productData.unit_entries?.length) {
        steps.push({
          name: 'create_units',
          execute: async () => {
            if (!createdProductId) throw new Error('Product ID not available');
            
            return await ProductUnitManagementService.createUnitsForProduct({
              productId: createdProductId,
              unitEntries: productData.unit_entries || [],
              defaultPricing: {
                price: productData.price,
                min_price: productData.min_price,
                max_price: productData.max_price
              }
            });
          },
          rollback: async (result) => {
            if (result?.barcodes) {
              // Delete created units
              for (const barcode of result.barcodes) {
                try {
                  const unit = await ProductUnitManagementService.getUnitBySerialNumber(barcode);
                  if (unit) {
                    await ProductUnitManagementService.deleteUnit(unit.id);
                  }
                } catch (error) {
                  logger.error('Failed to rollback unit creation', { barcode, error }, 'InventoryService');
                }
              }
            }
          }
        });
      }

      // Execute transaction
      const result = await TransactionManager.executeTransaction(steps, 'create_product');

      if (!result.success) {
        const errorMessage = result.errors[0]?.message || 'Failed to create product';
        toast.error(errorMessage);
        throw result.errors[0];
      }

      toast.success('Product created successfully');
      return result.results[0] as Product;
    }
  };
};

/**
 * UPDATE product with transactional unit updates
 */
export const useUpdateProduct = () => {
  const baseUpdate = productCRUD.useUpdate();

  return {
    ...baseUpdate,
    mutateAsync: async ({ id, data, unitUpdates }: { 
      id: string; 
      data: Partial<CreateProductData>;
      unitUpdates?: {
        newUnits?: UnitEntryForm[];
        updatedUnits?: Array<{ id: string; data: Partial<UnitEntryForm> }>;
        deletedUnitIds?: string[];
        moveAllUnitsToStore?: string;
      };
    }) => {
      logger.info('Updating product', { id, hasUnitUpdates: !!unitUpdates }, 'InventoryService');

      const steps: TransactionStep[] = [];
      const rollbackData: any[] = [];

      // Step 1: Update product
      steps.push({
        name: 'update_product',
        execute: async () => {
          const previousProduct = await InventoryManagementService.getProduct(id);
          rollbackData.push({ type: 'product', data: previousProduct });
          
          return await baseUpdate.mutateAsync({ id, data });
        },
        rollback: async () => {
          const previous = rollbackData.find(d => d.type === 'product')?.data;
          if (previous) {
            await InventoryManagementService.updateProduct(id, previous);
          }
        }
      });

      // Step 2: Handle unit updates if provided
      if (unitUpdates) {
        // Move all units to store
        if (unitUpdates.moveAllUnitsToStore) {
          steps.push({
            name: 'move_units_to_store',
            execute: async () => {
              const units = await ProductUnitManagementService.getUnitsForProduct(id, undefined, true);
              const previousStores = units.map(u => ({ id: u.id, store_id: u.store_id }));
              rollbackData.push({ type: 'unit_stores', data: previousStores });

              for (const unit of units) {
                await ProductUnitManagementService.updateUnitStore(unit.id, unitUpdates.moveAllUnitsToStore!);
              }
              
              return units.length;
            },
            rollback: async () => {
              const previous = rollbackData.find(d => d.type === 'unit_stores')?.data;
              if (previous) {
                for (const { id: unitId, store_id } of previous) {
                  await ProductUnitManagementService.updateUnitStore(unitId, store_id);
                }
              }
            }
          });
        }

        // Create new units
        if (unitUpdates.newUnits?.length) {
          steps.push({
            name: 'create_new_units',
            execute: async () => {
              return await ProductUnitManagementService.createUnitsForProduct({
                productId: id,
                unitEntries: unitUpdates.newUnits || [],
                defaultPricing: {
                  price: data.price,
                  min_price: data.min_price,
                  max_price: data.max_price
                }
              });
            }
          });
        }

        // Delete units
        if (unitUpdates.deletedUnitIds?.length) {
          steps.push({
            name: 'delete_units',
            execute: async () => {
              for (const unitId of unitUpdates.deletedUnitIds || []) {
                await ProductUnitManagementService.updateUnitStatus(unitId, 'damaged');
              }
              return unitUpdates.deletedUnitIds?.length || 0;
            }
          });
        }
      }

      // Execute transaction
      const result = await TransactionManager.executeTransaction(steps, 'update_product');

      if (!result.success) {
        const errorMessage = result.errors[0]?.message || 'Failed to update product';
        toast.error(errorMessage);
        throw result.errors[0];
      }

      toast.success('Product updated successfully');
      return result.results[0] as Product;
    }
  };
};

/**
 * DELETE product (uses base implementation)
 */
export const useDeleteProduct = productCRUD.useDelete;

// Export for compatibility
export { InventoryManagementService };
