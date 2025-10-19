import React from "react";
import { SearchBar } from "@/components/ui/search-bar";
import { Button } from "@/components/ui/button";

interface RepairSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export const RepairSearchBar: React.FC<RepairSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onSearch,
  onClear,
}) => {
  return (
    <div className="flex items-center gap-2">
      <SearchBar
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Cerca per cliente, dispositivo, ID riparazione o IMEI..."
        className="flex-1"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSearch();
          }
        }}
      />
      <Button onClick={onSearch} variant="filled" className="h-12">
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
  );
};
