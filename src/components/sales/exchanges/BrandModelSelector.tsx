import { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { optimizedSearchService, SearchResult } from '@/services/core/OptimizedSearchService';
import { useDebounce } from '@/hooks/useDebounce';

interface BrandModelSelectorProps {
  onSelect: (selection: {
    brand: string;
    model: string;
    category_id?: number;
    product_id?: string;
  }) => void;
  className?: string;
}

export function BrandModelSelector({ onSelect, className }: BrandModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const searchResults = await optimizedSearchService.search(query, {
        entityTypes: ['brand', 'model', 'product'],
        maxResults: 15,
        minScore: 0.1
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Error searching brands/models:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery);
  }, [debouncedQuery, performSearch]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'product') {
      // Product selected - use its brand and model
      onSelect({
        brand: result.metadata?.brand || '',
        model: result.metadata?.model || result.name,
        category_id: result.metadata?.category_id,
        product_id: result.id
      });
    } else if (result.type === 'model') {
      // Model selected - use brand from metadata
      onSelect({
        brand: result.metadata?.brand_name || '',
        model: result.name,
        category_id: result.metadata?.category_id
      });
    } else if (result.type === 'brand') {
      // Brand only - need to wait for model input
      onSelect({
        brand: result.name,
        model: '',
        category_id: result.metadata?.category_id
      });
    }
    
    setSearchQuery('');
    setOpen(false);
  };

  const groupedResults = results.reduce((acc, result) => {
    const type = result.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className={cn("space-y-2", className)}>
      <Label>Cerca Modello Conosciuto dal Catalogo</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="text-muted-foreground">
              Cerca marca, modello o prodotto...
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Digita per cercare..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isSearching ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : (
                <>
                  {!searchQuery.trim() || searchQuery.length < 2 ? (
                    <CommandEmpty>Digita almeno 2 caratteri per cercare</CommandEmpty>
                  ) : results.length === 0 ? (
                    <CommandEmpty>Nessun risultato trovato</CommandEmpty>
                  ) : (
                    <>
                      {groupedResults.product && groupedResults.product.length > 0 && (
                        <CommandGroup heading="Prodotti in Inventario">
                          {groupedResults.product.map((result) => (
                            <CommandItem
                              key={result.id}
                              value={result.id}
                              onSelect={() => handleSelect(result)}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                              <div className="flex-1">
                                <div className="font-medium">{result.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {result.metadata?.brand} - Stock: {result.metadata?.stock || 0}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      
                      {groupedResults.model && groupedResults.model.length > 0 && (
                        <CommandGroup heading="Modelli Conosciuti">
                          {groupedResults.model.map((result) => (
                            <CommandItem
                              key={result.id}
                              value={result.id}
                              onSelect={() => handleSelect(result)}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                              <div className="flex-1">
                                <div className="font-medium">{result.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {result.metadata?.brand_name}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      
                      {groupedResults.brand && groupedResults.brand.length > 0 && (
                        <CommandGroup heading="Marche">
                          {groupedResults.brand.map((result) => (
                            <CommandItem
                              key={result.id}
                              value={result.id}
                              onSelect={() => handleSelect(result)}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                              <div className="flex-1">
                                <div className="font-medium">{result.name}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        Cerca nel catalogo marche e modelli conosciuti
      </p>
    </div>
  );
}
