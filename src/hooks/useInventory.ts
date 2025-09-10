// ============================================
// UNIFIED INVENTORY HOOK - SINGLE DATA ACCESS POINT
// ============================================
// This hook consolidates all inventory operations and provides a single,
// consistent interface for components to interact with inventory data.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { InventoryManagementService } from '@/services/inventory/InventoryManagementService';
import { UnifiedProductCoordinator } from '@/services/shared/UnifiedProductCoordinator';
import { toast } from '@/components/ui/sonner';
import type { 
  Product, 
  ProductUnit, 
  ProductFormData, 
  InventorySearchFilters,
  BulkUpdateRequest,
  BulkDeleteRequest
} from '@/services/inventory/types';

// Query Keys
const INVENTORY_KEYS = {
  all: ['inventory'] as const,
  products: () => [...INVENTORY_KEYS.all, 'products'] as const,
  product: (id: string) => [...INVENTORY_KEYS.products(), id] as const,
  productUnits: (id: string) => [...INVENTORY_KEYS.product(id), 'units'] as const,
  categories: () => [...INVENTORY_KEYS.all, 'categories'] as const,
  stats: () => [...INVENTORY_KEYS.all, 'stats'] as const,
} as const;

export function useInventory() {
  const queryClient = useQueryClient();

  // ============================================
  // CROSS-MODULE SYNC
  // ============================================
  
  useEffect(() => {
    // Listen for product/unit changes from supplier module with aggressive cache invalidation
    const unsubscribe = UnifiedProductCoordinator.addEventListener((event) => {
      console.log('🔄 Inventory: Received coordination event:', event.type, 'from', event.source, event.metadata);
      
      if (event.source === 'supplier') {
        // Aggressively invalidate relevant queries when supplier creates/updates products/units
        switch (event.type) {
          case 'product_created':
          case 'product_updated':
          case 'stock_updated':
            console.log('💨 Inventory: Aggressively invalidating product caches due to supplier change');
            queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
            queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.product(event.entityId) });
            if (event.metadata?.productId) {
              queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.product(event.metadata.productId) });
              queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.productUnits(event.metadata.productId) });
            }
            break;
            
          case 'unit_created':
          case 'unit_updated':
            console.log('💨 Inventory: Aggressively invalidating unit caches due to supplier change');
            queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
            if (event.metadata?.productId) {
              queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.product(event.metadata.productId) });
              queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.productUnits(event.metadata.productId) });
            }
            break;
            
          case 'sync_requested':
            console.log('💨 Inventory: Full sync requested from supplier');
            queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.all });
            break;
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  // ============================================
  // PRODUCT QUERIES
  // ============================================

  const useProducts = (filters?: InventorySearchFilters) => {
    return useQuery({
      queryKey: [...INVENTORY_KEYS.products(), filters],
      queryFn: () => InventoryManagementService.getProducts(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const useProduct = (id: string) => {
    return useQuery({
      queryKey: INVENTORY_KEYS.product(id),
      queryFn: () => InventoryManagementService.getProductWithUnits(id),
      enabled: !!id,
    });
  };

  const useProductUnits = (productId: string) => {
    return useQuery({
      queryKey: INVENTORY_KEYS.productUnits(productId),
      queryFn: () => InventoryManagementService.getProductUnits(productId),
      enabled: !!productId,
    });
  };

  const useCategories = () => {
    return useQuery({
      queryKey: INVENTORY_KEYS.categories(),
      queryFn: () => InventoryManagementService.getCategories(),
      staleTime: 10 * 60 * 1000, // 10 minutes - categories change rarely
    });
  };

  // ============================================
  // PRODUCT MUTATIONS
  // ============================================

  const useCreateProduct = () => {
    return useMutation({
      mutationFn: (data: ProductFormData) => InventoryManagementService.createProduct(data),
      onSuccess: (result) => {
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
          toast.success('Product created successfully');
        } else {
          result.errors.forEach(error => toast.error(error));
        }
      },
      onError: (error) => {
        toast.error(`Failed to create product: ${error.message}`);
      },
    });
  };

  const useUpdateProduct = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<ProductFormData> }) => 
        InventoryManagementService.updateProduct(id, data),
      onSuccess: (result, { id }) => {
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.product(id) });
          queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
          toast.success('Product updated successfully');
        } else {
          result.errors.forEach(error => toast.error(error));
        }
      },
      onError: (error) => {
        toast.error(`Failed to update product: ${error.message}`);
      },
    });
  };

  const useDeleteProduct = () => {
    return useMutation({
      mutationFn: (id: string) => InventoryManagementService.deleteProduct(id),
      onSuccess: (result) => {
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
          toast.success('Product deleted successfully');
        } else {
          result.errors.forEach(error => toast.error(error));
        }
      },
      onError: (error) => {
        toast.error(`Failed to delete product: ${error.message}`);
      },
    });
  };

  // ============================================
  // BULK OPERATIONS
  // ============================================

  const useBulkUpdateProducts = () => {
    return useMutation({
      mutationFn: (request: BulkUpdateRequest) => 
        InventoryManagementService.bulkUpdateProducts(request),
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
        if (result.success) {
          toast.success(`Updated ${result.processed} products successfully`);
        } else {
          toast.error(`Bulk update completed with ${result.failed} failures`);
        }
      },
      onError: (error) => {
        toast.error(`Bulk update failed: ${error.message}`);
      },
    });
  };

  const useBulkDeleteProducts = () => {
    return useMutation({
      mutationFn: (request: BulkDeleteRequest) => 
        InventoryManagementService.bulkDeleteProducts(request),
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
        if (result.success) {
          toast.success(`Deleted ${result.processed} products successfully`);
        } else {
          toast.error(`Bulk delete completed with ${result.failed} failures`);
        }
      },
      onError: (error) => {
        toast.error(`Bulk delete failed: ${error.message}`);
      },
    });
  };

  // ============================================
  // BARCODE OPERATIONS
  // ============================================

  const useGenerateBarcode = () => {
    return useMutation({
      mutationFn: (unitId: string) => InventoryManagementService.generateUnitBarcode(unitId),
      onSuccess: (result, unitId) => {
        if (result.success) {
          // Invalidate queries that might include this unit
          queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
          toast.success('Barcode generated successfully');
        } else {
          result.errors.forEach(error => toast.error(error));
        }
      },
      onError: (error) => {
        toast.error(`Failed to generate barcode: ${error.message}`);
      },
    });
  };

  // ============================================
  // LABEL OPERATIONS
  // ============================================

  const useGenerateLabels = () => {
    return useMutation({
      mutationFn: ({ products, options }: { products: Product[]; options?: any }) => 
        InventoryManagementService.generateLabels(products, options),
      onSuccess: (result) => {
        if (result.success) {
          toast.success('Labels generated successfully');
        } else {
          result.errors.forEach(error => toast.error(error));
        }
      },
      onError: (error) => {
        toast.error(`Failed to generate labels: ${error.message}`);
      },
    });
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.products() });
  };

  const invalidateProduct = (id: string) => {
    queryClient.invalidateQueries({ queryKey: INVENTORY_KEYS.product(id) });
  };

  return {
    // Queries
    useProducts,
    useProduct,
    useProductUnits,
    useCategories,
    
    // Mutations
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useBulkUpdateProducts,
    useBulkDeleteProducts,
    useGenerateBarcode,
    useGenerateLabels,
    
    // Utilities
    invalidateProducts,
    invalidateProduct,
  };
}

// ============================================
// INDIVIDUAL HOOKS (For Backward Compatibility)
// ============================================

export const useProducts = (filters?: InventorySearchFilters) => {
  const { useProducts: useProductsHook } = useInventory();
  return useProductsHook(filters);
};

export const useProduct = (id: string) => {
  const { useProduct: useProductHook } = useInventory();
  return useProductHook(id);
};

export const useCreateProduct = () => {
  const { useCreateProduct: useCreateProductHook } = useInventory();
  return useCreateProductHook();
};

export const useUpdateProduct = () => {
  const { useUpdateProduct: useUpdateProductHook } = useInventory();
  return useUpdateProductHook();
};

export const useDeleteProduct = () => {
  const { useDeleteProduct: useDeleteProductHook } = useInventory();
  return useDeleteProductHook();
};