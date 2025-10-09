
import React, { useState, useCallback, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { InventoryTable } from "./InventoryTable";
import { InventoryFilters } from "./InventoryFilters";
import { useInventoryFilters } from "@/hooks/useInventoryFilters";
import { AddProductDialog } from "./AddProductDialog";
import { EditProductDialog } from "./EditProductDialog";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { BarcodeUpdateTool } from "./admin/BarcodeUpdateTool";
import { CrossModuleSyncButton } from "@/components/shared/CrossModuleSyncButton";
import { useProducts, useDeleteProduct, useCategories } from "@/services/inventory/LightweightInventoryService";
import { useBulkActions } from "./hooks/useBulkActions";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { RoleGuard } from "@/components/common/RoleGuard";
import { UserRole } from "@/types/roles";
import { Package } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { logger } from "@/utils/logger";

interface InventoryContentProps {
  showAddProduct: boolean;
  onAddProduct: () => void;
  onCancelAddProduct: () => void;
}

export function InventoryContent({ 
  showAddProduct, 
  onAddProduct, 
  onCancelAddProduct 
}: InventoryContentProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { filters, effectiveDateRange } = useInventoryFilters();
  
  // Use debounce for better UX - reduces API calls while typing
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 200);
  
  const queryClient = useQueryClient();
  const { data: products, isLoading, error, refetch, isFetching } = useProducts({
    ...filters,
    searchTerm: debouncedSearchTerm,
    dateRange: effectiveDateRange,
  });
  
  // Track if we're actively searching (search term exists and is being debounced)
  const isSearching = useMemo(() => 
    filters.searchTerm !== debouncedSearchTerm && filters.searchTerm.length > 0,
    [filters.searchTerm, debouncedSearchTerm]
  );
  const deleteProduct = useDeleteProduct();
  const { data: categories = [] } = useCategories();

  // Force refresh function for immediate table updates
  const refreshTable = useCallback(() => {
    logger.debug('Refreshing inventory table', {}, 'InventoryContent');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [refetch, queryClient]);
  
  const {
    selectedItems,
    isAllSelected,
    isIndeterminate,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    bulkDelete,
    bulkUpdateStatus,
    bulkUpdateCategory,
    selectedCount,
    isLoading: isBulkLoading,
  } = useBulkActions(Array.isArray(products) ? products : []);

  const handleViewModeChange = (newViewMode: "list" | "grid") => {
    setViewMode(newViewMode);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      // Clear selection if deleted item was selected
      if (selectedItems.includes(id)) {
        toggleSelectItem(id);
      }
      // Force immediate table refresh
      refreshTable();
      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted",
      });
    } catch (error) {
      logger.error('Delete error', error, 'InventoryContent');
      toast({
        title: "Delete Failed",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleProductAdded = useCallback(() => {
    logger.info('Product added - refreshing table', {}, 'InventoryContent');
    refreshTable();
  }, [refreshTable]);

  const handleProductUpdated = useCallback(() => {
    logger.info('Product updated - refreshing table', {}, 'InventoryContent');
    refreshTable();
  }, [refreshTable]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    logger.error('Products fetch error', error, 'InventoryContent');
    return (
      <EmptyState
        icon={<Package />}
        title="Error Loading Products"
        description="Failed to load products. Please try again."
      />
    );
  }

  if (!products || !Array.isArray(products) || products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <InventoryFilters
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onAddProduct={onAddProduct}
            categories={categories}
          />
        </div>
        <EmptyState
          icon={<Package />}
          title="No Products Found"
          description="Start by adding your first product to the inventory."
          action={{
            label: "Add Product",
            onClick: onAddProduct
          }}
        />
        
        {showAddProduct && (
          <AddProductDialog 
            open={showAddProduct}
            onClose={onCancelAddProduct}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {/* Barcode Update Tool - Only for authorized roles */}
      <RoleGuard requiredRoles={['super_admin' as UserRole, 'admin' as UserRole, 'inventory_manager' as UserRole]}>
        <div className="mb-6 flex items-center justify-between">
          <BarcodeUpdateTool />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Cross-module sync:</span>
            <CrossModuleSyncButton source="inventory" />
          </div>
        </div>
      </RoleGuard>

      <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
        <InventoryFilters
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAddProduct={onAddProduct}
          categories={categories}
        />
      </div>
      
      <BulkActionsToolbar
        selectedCount={selectedCount}
        selectedProducts={selectedItems.map(id => products?.find(p => p.id === id)).filter(Boolean)}
        onClearSelection={clearSelection}
        onBulkDelete={bulkDelete}
        onBulkUpdateStatus={bulkUpdateStatus}
        onBulkUpdateCategory={bulkUpdateCategory}
        isLoading={isBulkLoading}
      />
      
      <InventoryTable
        products={products || []}
        isLoading={isLoading}
        isFetching={isFetching || isSearching}
        searchTerm={debouncedSearchTerm}
        viewMode={viewMode}
        selectedItems={selectedItems}
        onSelectItem={toggleSelectItem}
        onSelectAll={toggleSelectAll}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onEdit={setEditingProduct}
        onDelete={handleDelete}
      />

      {/* Only render AddProductDialog when explicitly requested */}
      {showAddProduct && (
        <AddProductDialog 
          open={showAddProduct}
          onClose={onCancelAddProduct}
          onSuccess={handleProductAdded}
        />
      )}

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null);
            handleProductUpdated();
          }}
        />
      )}
    </>
  );
}
