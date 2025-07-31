
import React, { useState } from "react";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryTableToolbar } from "@/components/inventory/InventoryTableToolbar";
import { AddProductForm } from "@/components/inventory/AddProductForm";
import { Barcode } from "lucide-react";
import { useProductsRealtime } from "@/services/products/ProductReactQueryService";

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
  
  // Enable real-time updates for inventory
  useProductsRealtime();

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  const handleViewModeChange = (newViewMode: "list" | "grid") => {
    setViewMode(newViewMode);
  };

  // AddProductForm is now a dialog, no need for inline mode
  // if (showAddProduct) {
  //   return (
  //     <div className="bg-muted/50 p-4 rounded-lg">
  //       <AddProductForm />
  //     </div>
  //   );
  // }

  return (
    <>
      <InventoryTableToolbar 
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        searchTerm={searchTerm}
        viewMode={viewMode}
      />
      <InventoryTable searchTerm={searchTerm} viewMode={viewMode} />

      <div className="mt-4 flex items-center justify-center p-4 border border-dashed rounded-lg bg-muted/30">
        <div className="flex flex-col items-center text-center max-w-md p-4">
          <Barcode className="h-10 w-10 mb-2 text-primary" />
          <h3 className="text-lg font-medium">Barcode Scanner Ready</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use the camera scanner button in search fields or connect a hardware barcode scanner.
            Hardware scanners work automatically when typing in search fields.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 px-3 py-2 rounded-full">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Camera & Hardware Ready</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
