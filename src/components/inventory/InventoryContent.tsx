
import React, { useState } from "react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryTableToolbar } from "@/components/inventory/InventoryTableToolbar";
import { AddProductForm } from "@/components/inventory/AddProductForm";
import { Barcode } from "lucide-react";

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

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  const handleViewModeChange = (newViewMode: "list" | "grid") => {
    setViewMode(newViewMode);
  };

  if (showAddProduct) {
    return (
      <div className="bg-muted/50 p-4 rounded-lg">
        <AddProductForm onCancel={onCancelAddProduct} />
      </div>
    );
  }

  return (
    <>
      <InventoryTableToolbar 
        onAddProduct={onAddProduct}
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        searchTerm={searchTerm}
        viewMode={viewMode}
      />
      <InventoryTable searchTerm={searchTerm} viewMode={viewMode} />

      <div className="mt-4 flex items-center justify-center p-4 border border-dashed rounded-lg">
        <div className="flex flex-col items-center text-center max-w-md p-4">
          <Barcode className="h-10 w-10 mb-2 text-muted-foreground" />
          <h3 className="text-lg font-medium">Barcode Scanner Support</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connect a barcode scanner to quickly add or search for products.
            Simply focus on any search field and scan the barcode.
          </p>
        </div>
      </div>
    </>
  );
}
