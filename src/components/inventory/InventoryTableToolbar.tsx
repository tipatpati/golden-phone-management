
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Grid, List, FilterX, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function InventoryTableToolbar({ onAddProduct }: { onAddProduct: () => void }) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const queryClient = useQueryClient();
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Debounce could be added here for better performance
  };
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ['products', search] });
  };
  
  const clearSearch = () => {
    setSearch("");
    queryClient.invalidateQueries({ queryKey: ['products', ""] });
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <form 
        onSubmit={handleSearchSubmit}
        className="flex w-full items-center gap-2"
      >
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full pl-8 h-10"
            value={search}
            onChange={handleSearch}
          />
          {search && (
            <button 
              type="button"
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded"
              onClick={clearSearch}
            >
              <FilterX className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button type="submit" variant="outline" className="h-10 px-3 flex-shrink-0">
          <Search className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </form>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        <Button 
          variant="default" 
          onClick={onAddProduct}
          className="flex items-center justify-center gap-2 h-10 order-1 sm:order-none"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
        
        <div className="flex items-center justify-center sm:justify-end gap-2 order-2 sm:order-none">
          <Button 
            variant={viewMode === "grid" ? "default" : "outline"} 
            size="icon"
            onClick={() => setViewMode("grid")}
            className="h-10 w-10 flex items-center justify-center"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "list" ? "default" : "outline"} 
            size="icon"
            onClick={() => setViewMode("list")}
            className="h-10 w-10 flex items-center justify-center"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
