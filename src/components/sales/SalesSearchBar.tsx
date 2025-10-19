import React from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";

interface SalesSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isSearching?: boolean;
}

export function SalesSearchBar({ 
  searchTerm, 
  onSearchChange, 
  onSearch, 
  onClear, 
  isSearching = false 
}: SalesSearchBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Cerca per numero garentille, nome cliente o note..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
        />
        <Button onClick={onSearch} variant="filled" disabled={isSearching} className="h-12">
          {isSearching && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          <span className="hidden sm:inline">Cerca</span>
          <span className="sm:hidden">Cerca</span>
        </Button>
        {searchTerm && (
          <Button onClick={onClear} variant="outlined" className="h-12">
            <span className="hidden sm:inline">Cancella</span>
            <span className="sm:hidden">×</span>
          </Button>
        )}
      </div>
    </div>
  );
}