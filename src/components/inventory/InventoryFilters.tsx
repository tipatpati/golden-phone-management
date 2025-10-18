import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/enhanced-button";
import { Grid, List, FilterX, Plus, ChevronDown, ChevronUp, Calendar, Sparkles } from "lucide-react";
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
}

export function InventoryFilters({ 
  onViewModeChange, 
  viewMode,
  onAddProduct,
  categories = [],
}: InventoryFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { data: currentRole } = useCurrentUserRole();
  
  const safeCategories = categories ?? [];
  
  const {
    filters,
    setCategoryId,
    setStockStatus,
    setHasSerial,
    setSearchTerm,
    setDatePreset,
    setPriceRange,
    setYear,
    setSortBy,
    clearFilters,
    clearFilter,
    activeFilterCount,
    hasActiveFilters,
  } = useInventoryFilters();

  const [localSearchTerm, setLocalSearchTerm] = useState(filters.searchTerm || '');

  // Instant search - no debounce for real-time results
  useEffect(() => {
    setSearchTerm(localSearchTerm);
  }, [localSearchTerm, setSearchTerm]);
  
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
      <SearchBar
        value={localSearchTerm}
        onChange={setLocalSearchTerm}
        placeholder="Cerca per marca, modello, numero di serie o codice a barre..."
        className="w-full"
      />

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Filter */}
        <Select 
          value={filters.categoryId.toString()} 
          onValueChange={(value) => setCategoryId(value === 'all' ? 'all' : parseInt(value))}
        >
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {safeCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stock Status Filter */}
        <Select 
          value={filters.stockStatus} 
          onValueChange={(value) => setStockStatus(value as StockStatus)}
        >
          <SelectTrigger className="w-[160px] h-10">
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
            "w-[180px] h-10",
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

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="text" 
            size="sm"
            onClick={clearFilters}
            className="h-10"
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
          className="h-10"
        >
          {showAdvanced ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
          Avanzati
        </Button>

        <div className="flex-1" />

        {/* View Mode & Add Product */}
        <div className="flex items-center gap-2">
          {canModifyProducts && onAddProduct && (
            <Button onClick={onAddProduct} variant="filled" className="flex items-center gap-2 h-10">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Aggiungi</span>
            </Button>
          )}
          
          <Button 
            variant={viewMode === "grid" ? "filled" : "outlined"} 
            size="icon"
            onClick={() => onViewModeChange("grid")}
            className="h-10 w-10"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === "list" ? "filled" : "outlined"} 
            size="icon"
            onClick={() => onViewModeChange("list")}
            className="h-10 w-10"
          >
            <List className="h-4 w-4" />
          </Button>
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
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Ricerca: {filters.searchTerm}
              <button 
                onClick={() => {
                  setLocalSearchTerm('');
                  setSearchTerm('');
                }}
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
