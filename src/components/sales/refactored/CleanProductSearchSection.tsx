import React, { useState } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SalesProductService } from '@/services/sales/SalesProductService';
import { useSaleCreation } from '@/contexts/SaleCreationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Product } from '@/services/inventory/types';

export function CleanProductSearchSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addItem, state } = useSaleCreation();
  const { user } = useAuth();

  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const products = await SalesProductService.getProductsForSales(query);
      setResults(products);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Errore durante la ricerca prodotti');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
    performSearch(value);
  };

  const handleProductSelect = (product: Product) => {
    if (!user) return;

    // Check availability
    if (!product.has_serial && (product.stock || 0) <= 0) {
      toast.error('Prodotto non disponibile');
      return;
    }

    // Use max selling price for sales (no purchase price)
    let unitPrice = product.max_price || product.price || 0;

    if (unitPrice <= 0) {
      toast.error('Prezzo del prodotto non disponibile');
      return;
    }

    addItem({
      product_id: product.id,
      product_name: `${product.brand || ''} ${product.model || ''}`.trim(),
      brand: product.brand || '',
      model: product.model || '',
      year: product.year,
      quantity: 1,
      unit_price: unitPrice,
      stock: product.stock || 0,
      min_price: product.min_price || 0,
      max_price: product.max_price || 0,
      has_serial: product.has_serial,
      serial_number: '',
    });

    // Clear search after adding
    setSearchTerm('');
    setResults([]);
    toast.success('Prodotto aggiunto alla vendita');
  };

  const handleUnitSelect = (product: Product, unit: any) => {
    if (!user) return;

    // Check if this specific unit (by serial number) is already added
    const serialNumber = unit.serial_number || unit.barcode || '';
    const isAlreadyAdded = state.items.some(item => 
      item.product_id === product.id && 
      item.serial_number === serialNumber
    );

    if (isAlreadyAdded) {
      toast.error('Questa unità è già stata aggiunta alla vendita');
      return;
    }

    // Use max selling price for sales (no purchase price)
    let unitPrice = unit.max_price || unit.price || product.max_price || product.price || 0;

    if (unitPrice <= 0) {
      toast.error('Prezzo dell\'unità non disponibile');
      return;
    }

    addItem({
      product_id: product.id,
      product_unit_id: unit.id,
      product_name: `${product.brand || ''} ${product.model || ''}`.trim(),
      brand: product.brand || '',
      model: product.model || '',
      year: product.year,
      quantity: 1,
      unit_price: unitPrice,
      stock: 1,
      min_price: unit.min_price || product.min_price || 0,
      max_price: unit.max_price || product.max_price || 0,
      has_serial: true,
      serial_number: serialNumber,
    });

    setSearchTerm('');
    setResults([]);
    toast.success('Prodotto serializzato aggiunto alla vendita');
  };

  return (
    <div className="space-y-4">
      {/* Clean Header */}
      <div className="flex items-center gap-3">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-on-surface">Aggiungi Prodotti</h2>
      </div>

      {/* Clean Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cerca prodotti per brand, modello, codice o ultime 4 cifre IMEI..."
          value={searchTerm}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="pl-10 h-12 text-base bg-surface-container border-border/50 focus:border-primary"
        />
      </div>

      {/* Clean Results */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Ricerca in corso...
        </div>
      )}

      {!isLoading && searchTerm.length >= 2 && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Nessun prodotto trovato per "{searchTerm}"
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {results.map((product) => (
            <div
              key={product.id}
              className="p-4 bg-surface-container rounded-lg border border-border/30 hover:border-primary/50 transition-colors"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-on-surface truncate">
                    {product.brand} {product.model}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {product.has_serial ? (
                      <Badge variant="secondary" className="text-xs">
                        {product.product_units?.length || 0} unità
                      </Badge>
                    ) : (
                      <Badge variant={product.stock > 0 ? "default" : "destructive"} className="text-xs">
                        Stock: {product.stock || 0}
                      </Badge>
                    )}
                    {/* Only show selling prices, never purchase price for sales */}
                    {(product.max_price || product.price) && (
                      <span className="text-sm text-muted-foreground">
                        €{(product.max_price || product.price).toFixed(2)}
                        {product.min_price && product.max_price && product.min_price !== product.max_price && (
                          <span className="text-xs ml-1">
                            (da €{product.min_price.toFixed(2)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Add Button for Non-Serialized */}
                {!product.has_serial && (
                  <Button
                    onClick={() => handleProductSelect(product)}
                    disabled={product.stock <= 0}
                    size="sm"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi
                  </Button>
                )}
              </div>

              {/* Serialized Units */}
              {product.has_serial && product.product_units && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">Unità disponibili:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(() => {
                      const availableUnits = product.product_units.filter((unit: any) => {
                        // Filter out units that are already added to the sale
                        const serialNumber = unit.serial_number || unit.barcode || '';
                        return !state.items.some(item => 
                          item.product_id === product.id && 
                          item.serial_number === serialNumber
                        );
                      });

                      if (availableUnits.length === 0) {
                        return (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            Tutte le unità sono già state aggiunte alla vendita
                          </div>
                        );
                      }

                      return availableUnits.map((unit: any) => (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between p-2 bg-surface border border-border/20 rounded text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="font-mono text-xs truncate block">
                              {unit.serial_number || unit.barcode}
                            </span>
                            {/* Only show selling prices, never purchase price for sales */}
                            {(unit.max_price || unit.price) && (
                              <span className="text-muted-foreground">
                                €{(unit.max_price || unit.price).toFixed(2)}
                                {unit.min_price && unit.max_price && unit.min_price !== unit.max_price && (
                                  <span className="text-xs ml-1">
                                    (da €{unit.min_price.toFixed(2)})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <Button
                            onClick={() => handleUnitSelect(product, unit)}
                            size="sm"
                            variant="outline"
                            className="ml-2 shrink-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {searchTerm.length < 2 && (
        <div className="text-center py-8 text-muted-foreground">
          Inserisci almeno 2 caratteri per iniziare la ricerca
        </div>
      )}
    </div>
  );
}