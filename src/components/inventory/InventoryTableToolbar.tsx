import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid, List, FilterX } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { SimpleAddProductDialog } from "./SimpleAddProductDialog";
import { useCurrentUserRole } from "@/hooks/useRoleManagement";
import { roleUtils } from "@/utils/roleUtils";

interface InventoryTableToolbarProps {
  onSearchChange: (searchTerm: string) => void;
  onViewModeChange: (viewMode: "list" | "grid") => void;
  searchTerm: string;
  viewMode: "list" | "grid";
}

export function InventoryTableToolbar({ 
  onSearchChange, 
  onViewModeChange, 
  searchTerm, 
  viewMode 
}: InventoryTableToolbarProps) {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: currentRole } = useCurrentUserRole();
  
  // Debug logging
  console.log('🔍 InventoryTableToolbar Debug:', {
    currentRole,
    hasInventoryPermission: currentRole ? roleUtils.hasPermission(currentRole, 'inventory') : false,
    roleUtils_hasPermission_result: currentRole ? roleUtils.hasPermission(currentRole, 'inventory') : 'no role'
  });
  
  // Check if user can add products using permission-based check
  const canModifyProducts = currentRole && roleUtils.hasPermission(currentRole, 'inventory');
  
  const { setupHardwareScanner } = useBarcodeScanner({
    onScan: (result) => {
      onSearchChange(result);
    }
  });

  useEffect(() => {
    if (searchInputRef.current) {
      const cleanup = setupHardwareScanner(searchInputRef.current);
      return cleanup;
    }
  }, [setupHardwareScanner]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    onSearchChange(newSearchTerm);
  };

  const handleBarcodeScanned = (barcode: string) => {
    onSearchChange(barcode);
  };
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // The search is handled in real-time via onSearchChange
  };
  
  const clearSearch = () => {
    onSearchChange("");
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <form 
        onSubmit={handleSearchSubmit}
        className="flex w-full items-center gap-3"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Cerca prodotti o scansiona barcode..."
            className="w-full pl-10 pr-20 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearch}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {searchTerm && (
              <button 
                type="button"
                className="p-1 hover:bg-muted rounded transition-colors"
                onClick={clearSearch}
              >
                <FilterX className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <BarcodeScannerTrigger
              onScan={handleBarcodeScanned}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            />
          </div>
        </div>
        <Button type="submit" variant="outline" className="h-12 px-4 flex-shrink-0">
          <Search className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Cerca</span>
        </Button>
      </form>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        {canModifyProducts && <SimpleAddProductDialog />}
        
        <div className="flex items-center justify-center sm:justify-end gap-2 order-2 sm:order-none">
          <Button 
            variant={viewMode === "grid" ? "default" : "outline"} 
            size="icon"
            onClick={() => onViewModeChange("grid")}
            className="h-12 w-12 flex items-center justify-center"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="icon"
            onClick={() => onViewModeChange("list")}
            className="h-12 w-12 flex items-center justify-center"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}