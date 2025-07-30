import { useState, useMemo } from "react";

interface UseTableDataProps<T> {
  data: T[];
  searchableFields: (keyof T)[];
  filterableFields?: Record<string, (item: T) => string | boolean>;
}

interface UseTableDataReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  filteredData: T[];
  clearFilters: () => void;
}

export function useTableData<T>({
  data,
  searchableFields,
  filterableFields = {}
}: UseTableDataProps<T>): UseTableDataReturn<T> {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFiltersState] = useState<Record<string, string>>({});

  const setFilter = (key: string, value: string) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFiltersState({});
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Search filter
      const matchesSearch = searchTerm === "" || searchableFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });

      // Custom filters
      const matchesFilters = Object.entries(filters).every(([filterKey, filterValue]) => {
        if (filterValue === "all" || filterValue === "") return true;
        
        const filterFunction = filterableFields[filterKey];
        if (!filterFunction) return true;
        
        const itemValue = filterFunction(item);
        return itemValue === filterValue || itemValue === true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [data, searchTerm, filters, searchableFields, filterableFields]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    filteredData,
    clearFilters
  };
}