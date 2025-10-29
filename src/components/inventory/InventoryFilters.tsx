import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/enhanced-button";
import { Grid, List, FilterX, Plus, ChevronDown, ChevronUp, Calendar, Sparkles, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCurrentUserRole } from "@/hooks/useRoleManagement";
import { roleUtils } from "@/utils/roleUtils";
import { useInventoryFilters, type DatePreset, type StockStatus, type SerialFilter, type SortOption } from "@/hooks/useInventoryFilters";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/ui/search-bar";

interface InventoryFiltersProps {
  onViewModeChange: (viewMode: "list" | "grid") => void;
  viewMode: "list" | "grid";
  onAddProduct?: () => void;
  categories: Array<{ id: number; name: string }>;
  searchQuery: string;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
}

export function InventoryFilters({ 
  onViewModeChange, 
  viewMode,
  onAddProduct,
  categories = [],
  searchQuery,
  onSearch,
  onClearSearch,
}: InventoryFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: currentRole } = useCurrentUserRole();
  
  const safeCategories = categories ?? [];
  
  const {
    filters,
    setCategoryId,
    setStockStatus,
    setHasSerial,
    setDatePreset,
    setPriceRange,
    setYear,
    setSortBy,
    clearFilters,
    clearFilter,
    activeFilterCount,
    hasActiveFilters,
  } = useInventoryFilters();

  const [localSearchTerm, setLocalSearchTerm] = useState(searchQuery);

  // Sync local search term with prop changes
  useEffect(() => {
    setLocalSearchTerm(searchQuery);
  }, [searchQuery]);

  // Manual search - only trigger when user submits
  const handleSearch = () => {
    onSearch(localSearchTerm.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onClearSearch();
  };
  
  const canModifyProducts = currentRole && roleUtils.hasPermission(currentRole, 'inventory');

  const availableYears = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i);
    }
    return years;
  }, []);

  const datePresetLabels: Record<DatePreset, string> = {
    all: 'Tutti',
    today: 'Oggi',
    week: 'Ultimi 7 giorni',
    month: 'Ultimi 30 giorni',
    quarter: 'Ultimi 90 giorni',
    custom: 'Personalizzato',
  };

  const stockStatusLabels: Record<StockStatus, string> = {
    all: 'Tutti',
    in_stock: 'Disponibile',
    low_stock: 'Scorta bassa',
    out_of_stock: 'Esaurito',
  };

  const sortLabels: Record<SortOption, string> = {
    newest: 'Più recenti',
    oldest: 'Meno recenti',
    name_asc: 'Nome A-Z',
    name_desc: 'Nome Z-A',
    price_asc: 'Prezzo crescente',
    price_desc: 'Prezzo decrescente',
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search Bar - Full Width */}
      <div className="flex gap-2 w-full">
        <div className="flex-1">
          <SearchBar
            value={localSearchTerm}
            onChange={setLocalSearchTerm}
            onKeyDown={handleKeyPress}
            placeholder="Cerca per marca, modello, numero di serie o codice a barre..."
            className="w-full"
          />
        </div>
        <Button 
          onClick={handleSearch}
          variant="filled"
          size="default"
          className="h-10 px-6"
        >
          <Search className="h-4 w-4 mr-2" />
          Cerca
        </Button>
      </div>

      {/* Filters Row - Stack on mobile, wrap on tablet/desktop */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-2">
        {/* Category Filter */}
        <Select 
          value={filters.categoryId === 'all' ? 'all' : filters.categoryId.toString()} 
          onValueChange={(value) => setCategoryId(value === 'all' ? 'all' : parseInt(value))}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue>
              {filters.categoryId === 'all' 
                ? 'Tutte le categorie' 
                : safeCategories.find(c => c.id === filters.categoryId)?.name || 'Tutte le categorie'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {safeCategories.length > 0 ? (
              safeCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-categories" disabled>
                Nessuna categoria disponibile
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        {/* Stock Status Filter */}
        <Select 
          value={filters.stockStatus} 
          onValueChange={(value) => setStockStatus(value as StockStatus)}
        >
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(stockStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Recently Added Quick Filter */}
        <Select 
          value={filters.datePreset} 
          onValueChange={(value) => setDatePreset(value as DatePreset)}
        >
          <SelectTrigger className={cn(
            "w-full sm:w-[180px] h-10",
            filters.datePreset !== 'all' && "border-primary"
          )}>
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(datePresetLabels).filter(([key]) => key !== 'custom').map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {value !== 'all' && <Sparkles className="h-3 w-3 mr-2 inline" />}
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters & Advanced - Row on mobile */}
        <div className="flex w-full sm:w-auto gap-2">
          {hasActiveFilters && (
            <Button 
              variant="text" 
              size="sm"
              onClick={clearFilters}
              className="h-10 flex-1 sm:flex-none"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Cancella filtri
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Advanced Filters Toggle */}
          <Button 
            variant="outlined" 
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn("h-10", hasActiveFilters ? "flex-1 sm:flex-none" : "w-full sm:w-auto")}
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
            Avanzati
          </Button>
        </div>

        <div className="hidden sm:block sm:flex-1" />

        {/* View Mode & Add Product - Full row on mobile */}
        <div className="flex w-full sm:w-auto items-center gap-2">
          {canModifyProducts && onAddProduct && (
            <Button onClick={onAddProduct} variant="filled" className="flex items-center gap-2 h-10 flex-1 sm:flex-none">
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Aggiungi</span>
              <span className="sm:hidden">Nuovo Prodotto</span>
            </Button>
          )}
          
          <div className="flex gap-2 shrink-0">
            <Button 
              variant={viewMode === "grid" ? "filled" : "outlined"} 
              size="icon"
              onClick={() => onViewModeChange("grid")}
              className="h-10 w-10 shrink-0"
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4 shrink-0" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "filled" : "outlined"} 
              size="icon"
              onClick={() => onViewModeChange("list")}
              className="h-10 w-10 shrink-0"
              aria-label="List view"
            >
              <List className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Serial Tracking Filter */}
            <div>
              <label className="text-xs font-medium mb-1 block">Tracciamento seriale</label>
              <Select 
                value={filters.hasSerial} 
                onValueChange={(value) => setHasSerial(value as SerialFilter)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="yes">Con seriale</SelectItem>
                  <SelectItem value="no">Senza seriale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="text-xs font-medium mb-1 block">Anno</label>
              <Select 
                value={filters.year.toString()} 
                onValueChange={(value) => setYear(value === 'all' ? 'all' : parseInt(value))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range - Min */}
            <div>
              <label className="text-xs font-medium mb-1 block">Prezzo min (€)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.priceRange?.min ?? ''}
                onChange={(e) => {
                  const min = e.target.value ? parseFloat(e.target.value) : undefined;
                  setPriceRange(min, filters.priceRange?.max);
                }}
                className="h-9"
              />
            </div>

            {/* Price Range - Max */}
            <div>
              <label className="text-xs font-medium mb-1 block">Prezzo max (€)</label>
              <Input
                type="number"
                placeholder="999999"
                value={filters.priceRange?.max ?? ''}
                onChange={(e) => {
                  const max = e.target.value ? parseFloat(e.target.value) : undefined;
                  setPriceRange(filters.priceRange?.min, max);
                }}
                className="h-9"
              />
            </div>

            {/* Sort By */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium mb-1 block">Ordina per</label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {(searchQuery || activeFilterCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Ricerca: {searchQuery}
              <button 
                onClick={handleClearSearch}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.categoryId !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Categoria: {safeCategories.find(c => c.id === filters.categoryId)?.name}
              <button 
                onClick={() => clearFilter('categoryId')}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.stockStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Stock: {stockStatusLabels[filters.stockStatus]}
              <button 
                onClick={() => clearFilter('stockStatus')}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.datePreset !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {datePresetLabels[filters.datePreset]}
              <button 
                onClick={() => clearFilter('datePreset')}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.hasSerial !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Seriale: {filters.hasSerial === 'yes' ? 'Sì' : 'No'}
              <button 
                onClick={() => clearFilter('hasSerial')}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.year !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Anno: {filters.year}
              <button 
                onClick={() => clearFilter('year')}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.priceRange && (
            <Badge variant="secondary" className="gap-1">
              Prezzo: €{filters.priceRange.min ?? 0} - €{filters.priceRange.max ?? '∞'}
              <button 
                onClick={() => clearFilter('priceRange')}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <FilterX className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
