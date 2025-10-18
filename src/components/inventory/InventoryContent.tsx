
import React, { useState, useCallback, useEffect } from "react";
import { InventoryTable } from "./InventoryTable";
import { InventoryFilters } from "./InventoryFilters";
import { useInventoryFilters } from "@/hooks/useInventoryFilters";
import { useInventorySearch } from "@/hooks/useInventorySearch";
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
  
  // Separate search and filters
  const { searchQuery, searchTrigger, isSearching, executeSearch, clearSearch, completeSearch } = useInventorySearch();
  const { filters, effectiveDateRange, hasActiveFilters } = useInventoryFilters();
  
  const queryClient = useQueryClient();
  const { data: products = [], isLoading, error, refetch, isFetching } = useProducts(searchQuery, {
    ...filters,
    dateRange: effectiveDateRange,
  });
  
  const deleteProduct = useDeleteProduct();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories();
  
  // Debug: Log categories state
  useEffect(() => {
    console.log('📦 Categories state:', { categories, categoriesLoading, categoriesError });
  }, [categories, categoriesLoading, categoriesError]);

  // Force refetch when search is triggered
  useEffect(() => {
    if (searchTrigger > 0) {
      refetch().then(() => {
        completeSearch();
      });
    }
  }, [searchTrigger, refetch, completeSearch]);

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
      if (selectedItems.includes(id)) {
        toggleSelectItem(id);
      }
      refreshTable();
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted.",
      });
    } catch (error) {
      logger.error('Failed to delete product', error, 'InventoryContent');
      toast({
        title: "Error",
        description: "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProductAdded = useCallback(() => {
    logger.info('Product added successfully', {}, 'InventoryContent');
    refreshTable();
  }, [refreshTable]);

  const handleProductUpdated = useCallback(() => {
    logger.info('Product updated successfully', {}, 'InventoryContent');
    setEditingProduct(null);
    refreshTable();
  }, [refreshTable]);

  const canAddProduct = true;

  if (isLoading) {
    return (
      <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xl p-6">
        <InventoryFilters
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAddProduct={onAddProduct}
          categories={categories}
          searchQuery={searchQuery}
          onSearch={executeSearch}
          onClearSearch={clearSearch}
        />
      </div>
        <LoadingState message="Loading inventory..." />
      </div>
    );
  }

  if (error) {
    logger.error('Failed to load inventory', error, 'InventoryContent');
    return (
      <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xl p-6">
        <InventoryFilters
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAddProduct={onAddProduct}
          categories={categories}
          searchQuery={searchQuery}
          onSearch={executeSearch}
          onClearSearch={clearSearch}
        />
      </div>
        <div className="text-center text-red-600">
          <p>Failed to load inventory. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    logger.info('No products found', { filters, hasActiveFilters }, 'InventoryContent');
    
    const getEmptyStateContent = () => {
      if (hasActiveFilters || searchQuery) {
        return {
          title: "No Products Match Filters",
          description: searchQuery 
            ? `No products found for "${searchQuery}". Try a different search term.`
            : "No products match your current filters. Try adjusting or clearing filters.",
        };
      }
      return {
        title: "No Products Yet",
        description: "Your inventory is empty. Start by adding your first product.",
      };
    };

    const { title, description } = getEmptyStateContent();

    return (
      <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xl p-6">
        <InventoryFilters
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAddProduct={onAddProduct}
          categories={categories}
          searchQuery={searchQuery}
          onSearch={executeSearch}
          onClearSearch={clearSearch}
        />
      </div>
        <EmptyState
          icon={<Package className="h-16 w-16 text-muted-foreground" />}
          title={title}
          description={description}
          action={
            onAddProduct && !hasActiveFilters ? {
              label: "Add Product",
              onClick: onAddProduct,
            } : undefined
          }
        />
        
        {showAddProduct && (
          <AddProductDialog 
            open={showAddProduct}
            onClose={onCancelAddProduct}
            onSuccess={handleProductAdded}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xl p-6">
        <InventoryFilters
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onAddProduct={canAddProduct ? onAddProduct : undefined}
          categories={categories}
          searchQuery={searchQuery}
          onSearch={executeSearch}
          onClearSearch={clearSearch}
        />
      </div>


      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <InventoryTable
          products={products}
          viewMode={viewMode}
          searchTerm={searchQuery}
          onDelete={handleDelete}
          onEdit={setEditingProduct}
          selectedItems={selectedItems}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          onSelectAll={toggleSelectAll}
          onSelectItem={toggleSelectItem}
          isLoading={isFetching || isSearching}
          isFetching={isFetching || isSearching}
        />
      </div>

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
          onSuccess={handleProductUpdated}
        />
      )}
    </div>
  );
}
