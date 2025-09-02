import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useDeleteProducts, useUpdateProducts } from "@/services/products/ProductReactQueryService";

export interface BulkActionsState {
  selectedItems: string[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export function useBulkActions(items: any[] = []) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const deleteProducts = useDeleteProducts();
  const updateProducts = useUpdateProducts();

  const isAllSelected = selectedItems.length === items.length && items.length > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < items.length;

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  }, [items, isAllSelected]);

  const toggleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(itemId);
      if (isSelected) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const bulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) return;

    try {
      await deleteProducts.mutateAsync(selectedItems);
      setSelectedItems([]);
      toast({
        title: "Products Deleted",
        description: `Successfully deleted ${selectedItems.length} products`,
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete selected products",
        variant: "destructive",
      });
    }
  }, [selectedItems, deleteProducts]);

  const bulkUpdateStatus = useCallback(async (status: string) => {
    if (selectedItems.length === 0) return;

    try {
      const updates = selectedItems.map(id => ({
        id,
        status
      }));
      
      await updateProducts.mutateAsync(updates);
      setSelectedItems([]);
      toast({
        title: "Products Updated",
        description: `Successfully updated ${selectedItems.length} products`,
      });
    } catch (error) {
      console.error('Bulk update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update selected products",
        variant: "destructive",
      });
    }
  }, [selectedItems, updateProducts]);

  const bulkUpdateCategory = useCallback(async (categoryId: number) => {
    if (selectedItems.length === 0) return;

    try {
      const updates = selectedItems.map(id => ({
        id,
        category_id: categoryId
      }));
      
      await updateProducts.mutateAsync(updates);
      setSelectedItems([]);
      toast({
        title: "Products Updated",
        description: `Successfully updated category for ${selectedItems.length} products`,
      });
    } catch (error) {
      console.error('Bulk category update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update product categories",
        variant: "destructive",
      });
    }
  }, [selectedItems, updateProducts]);

  return {
    selectedItems,
    isAllSelected,
    isIndeterminate,
    toggleSelectAll,
    toggleSelectItem,
    clearSelection,
    bulkDelete,
    bulkUpdateStatus,
    bulkUpdateCategory,
    selectedCount: selectedItems.length,
    isLoading: deleteProducts.isPending || updateProducts.isPending,
  };
}