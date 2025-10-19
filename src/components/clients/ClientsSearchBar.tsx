import React from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";

interface ClientsSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export const ClientsSearchBar = ({ 
  searchQuery, 
  onSearchChange, 
  onSearch,
  onClear 
}: ClientsSearchBarProps) => {
  return (
    <div className="flex items-center gap-2">
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Cerca clienti per nome, email o telefono..."
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch();
          }
        }}
      />
      <Button onClick={onSearch} variant="default">
        Cerca
      </Button>
      {searchQuery && (
        <Button onClick={onClear} variant="outline">
          Cancella
        </Button>
      )}
    </div>
  );
};
