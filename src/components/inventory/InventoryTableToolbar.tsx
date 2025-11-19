import React, { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid, List, FilterX, Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { useCurrentUserRole } from "@/hooks/useRoleManagement";
import { roleUtils } from "@/utils/roleUtils";
import { logger } from "@/utils/logger";

interface InventoryTableToolbarProps {
  onSearchChange: (searchTerm: string) => void;
  onViewModeChange: (viewMode: "list" | "grid") => void;
  searchTerm: string;
  viewMode: "list" | "grid";
  onAddProduct?: () => void;
  isSearching?: boolean;
}

export function InventoryTableToolbar({ 
  onSearchChange, 
  onViewModeChange, 
  searchTerm, 
  viewMode,
  onAddProduct,
  isSearching = false
}: InventoryTableToolbarProps) {
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: currentRole } = useCurrentUserRole();
  
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
  
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    logger.debug('Search input changed', { searchTerm: newSearchTerm }, 'InventoryTableToolbar');
    onSearchChange(newSearchTerm);
  }, [onSearchChange]);

  const handleBarcodeScanned = useCallback((barcode: string) => {
    onSearchChange(barcode);
  }, [onSearchChange]);
  
  const clearSearch = useCallback(() => {
    onSearchChange("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [onSearchChange]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex w-full items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Search by brand, model, barcode, or serial..."
            className="w-full pl-10 pr-24 h-12 text-base border-input focus:border-primary focus:ring-primary"
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isSearching && (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            )}
            {searchTerm && !isSearching && (
              <button 
                type="button"
                className="p-1 hover:bg-muted rounded transition-colors"
                onClick={clearSearch}
                title="Clear search"
              >
                <FilterX className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        {canModifyProducts && onAddProduct && (
          <Button onClick={onAddProduct} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
        
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => onViewModeChange("list")}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => onViewModeChange("grid")}
            title="Grid View"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}