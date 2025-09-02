
import React, { useState } from "react";
import { InventoryTable } from "./InventoryTable";
import { InventoryTableToolbar } from "./InventoryTableToolbar";
import { AddProductDialog } from "./AddProductDialog";
import { EditProductDialog } from "./EditProductDialog";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { useProducts, useDeleteProduct } from "@/services/products/ProductReactQueryService";
import { useBulkActions } from "./hooks/useBulkActions";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Package } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  
  const { data: products, isLoading, error } = useProducts(searchTerm);
  const deleteProduct = useDeleteProduct();
  
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

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

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
      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    console.error('Products fetch error:', error);
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
        <InventoryTableToolbar 
          onSearchChange={handleSearchChange}
          onViewModeChange={handleViewModeChange}
          searchTerm={searchTerm}
          viewMode={viewMode}
          onAddProduct={onAddProduct}
        />
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
      <InventoryTableToolbar 
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        searchTerm={searchTerm}
        viewMode={viewMode}
        onAddProduct={onAddProduct}
      />
      
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
        searchTerm={searchTerm}
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
        />
      )}

      {editingProduct && (
        <EditProductDialog
          product={editingProduct}
          open={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => setEditingProduct(null)}
        />
      )}
    </>
  );
}
