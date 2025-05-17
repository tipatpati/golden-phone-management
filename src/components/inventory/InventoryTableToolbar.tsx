
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
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <form 
        onSubmit={handleSearchSubmit}
        className="flex w-full items-center space-x-2 md:w-96"
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full pl-8"
            value={search}
            onChange={handleSearch}
          />
          {search && (
            <button 
              type="button"
              className="absolute right-2.5 top-2.5"
              onClick={clearSearch}
            >
              <FilterX className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <div className="flex items-center gap-2">
        <Button 
          variant="default" 
          size="sm"
          onClick={onAddProduct}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
        <Button 
          variant={viewMode === "grid" ? "default" : "outline"} 
          size="icon"
          onClick={() => setViewMode("grid")}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button 
          variant={viewMode === "list" ? "default" : "outline"} 
          size="icon"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
