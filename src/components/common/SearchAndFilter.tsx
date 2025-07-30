import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  actions?: React.ReactNode;
  className?: string;
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  placeholder = "Cerca...",
  filters = [],
  actions,
  className = ""
}: SearchAndFilterProps) {
  const hasActiveFilters = filters.some(filter => filter.value !== "all" && filter.value !== "");

  const clearFilters = () => {
    filters.forEach(filter => filter.onChange("all"));
    onSearchChange("");
  };

  return (
    <div className={`bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 sm:h-12 text-sm sm:text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            type="search"
          />
        </div>

        {/* Filters */}
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm min-w-[120px]"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancella
          </Button>
        )}

        {/* Additional Actions */}
        {actions}
      </div>
    </div>
  );
}