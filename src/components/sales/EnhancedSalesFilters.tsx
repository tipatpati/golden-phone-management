import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export interface SalesFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  paymentMethod?: string;
  clientId?: string;
  salespersonId?: string;
  minAmount?: number;
  maxAmount?: number;
  hasItems?: boolean;
}

interface EnhancedSalesFiltersProps {
  filters: SalesFilters;
  onFiltersChange: (filters: SalesFilters) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function EnhancedSalesFilters({ 
  filters, 
  onFiltersChange, 
  onReset, 
  isLoading 
}: EnhancedSalesFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<SalesFilters>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SalesFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (key: keyof SalesFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(localFilters).filter(key => 
      localFilters[key as keyof SalesFilters] !== undefined && 
      localFilters[key as keyof SalesFilters] !== null &&
      localFilters[key as keyof SalesFilters] !== ''
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri Avanzati
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Nascondi' : 'Mostra'} Avanzati
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={onReset}>
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date From */}
          <div className="space-y-2">
            <Label>Data Da</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !localFilters.dateFrom && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateFrom ? (
                    format(localFilters.dateFrom, "PPP", { locale: it })
                  ) : (
                    "Seleziona data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localFilters.dateFrom}
                  onSelect={(date) => handleFilterChange('dateFrom', date)}
                  locale={it}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label>Data A</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !localFilters.dateTo && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {localFilters.dateTo ? (
                    format(localFilters.dateTo, "PPP", { locale: it })
                  ) : (
                    "Seleziona data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={localFilters.dateTo}
                  onSelect={(date) => handleFilterChange('dateTo', date)}
                  locale={it}
                  disabled={(date) =>
                    date > new Date() || 
                    date < new Date("1900-01-01") ||
                    (localFilters.dateFrom && date < localFilters.dateFrom)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={localFilters.status || ''} 
              onValueChange={(value) => handleFilterChange('status', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutti gli status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutti</SelectItem>
                <SelectItem value="completed">Completata</SelectItem>
                <SelectItem value="pending">In Attesa</SelectItem>
                <SelectItem value="cancelled">Annullata</SelectItem>
                <SelectItem value="refunded">Rimborsata</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Metodo di Pagamento</Label>
                <Select 
                  value={localFilters.paymentMethod || ''} 
                  onValueChange={(value) => handleFilterChange('paymentMethod', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti i metodi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tutti</SelectItem>
                    <SelectItem value="cash">Contanti</SelectItem>
                    <SelectItem value="card">Carta</SelectItem>
                    <SelectItem value="bank_transfer">Bonifico</SelectItem>
                    <SelectItem value="hybrid">Ibrido</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Amount */}
              <div className="space-y-2">
                <Label>Importo Minimo (€)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={localFilters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', 
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Max Amount */}
              <div className="space-y-2">
                <Label>Importo Massimo (€)</Label>
                <Input
                  type="number"
                  placeholder="999999.99"
                  value={localFilters.maxAmount || ''}
                  onChange={(e) => handleFilterChange('maxAmount', 
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-2 block">Filtri Attivi:</Label>
            <div className="flex flex-wrap gap-2">
              {localFilters.dateFrom && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => removeFilter('dateFrom')}>
                  Da: {format(localFilters.dateFrom, "dd/MM/yyyy")}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {localFilters.dateTo && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => removeFilter('dateTo')}>
                  A: {format(localFilters.dateTo, "dd/MM/yyyy")}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {localFilters.status && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => removeFilter('status')}>
                  Status: {localFilters.status}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {localFilters.paymentMethod && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => removeFilter('paymentMethod')}>
                  Pagamento: {localFilters.paymentMethod}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {localFilters.minAmount !== undefined && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => removeFilter('minAmount')}>
                  Min: €{localFilters.minAmount}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
              {localFilters.maxAmount !== undefined && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => removeFilter('maxAmount')}>
                  Max: €{localFilters.maxAmount}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}