import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Package, 
  Smartphone, 
  AlertTriangle,
  QrCode,
  Plus
} from 'lucide-react';
import { SalesProductService } from '@/services/sales/SalesProductService';
import { useSaleCreation } from '@/contexts/SaleCreationContext';
import { useToast } from '@/hooks/use-toast';
import { getProductPricingInfoSync } from '@/utils/unitPricingUtils';
import type { Product } from '@/services/inventory/types';

export function ProductSearchSection() {
  console.log('🔍 ProductSearchSection rendering');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useSaleCreation();
  const { toast } = useToast();

  // Search for products
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await SalesProductService.getProductsForSales(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({ 
        title: 'Errore', 
        description: 'Errore durante la ricerca prodotti', 
        variant: 'destructive' 
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input
  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      performSearch(value);
    } else {
      setSearchResults([]);
    }
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    // Check availability
    const hasStock = product.has_serial 
      ? product.product_units?.some(unit => unit.status === 'available')
      : product.stock > 0;

    if (!hasStock) {
      toast({ 
        title: 'Prodotto non disponibile', 
        description: 'Il prodotto selezionato non è disponibile',
        variant: 'destructive' 
      });
      return;
    }

    // Get pricing information using the utility
    const pricingInfo = getProductPricingInfoSync({
      price: product.price || 0,
      has_serial: product.has_serial || false,
      min_price: product.min_price,
      max_price: product.max_price
    });
    let unitPrice = 0;

    // Determine the best price to use
    if (pricingInfo.priceRange) {
      // Use the minimum price from range as starting point
      unitPrice = pricingInfo.priceRange.min;
    } else if (product.price > 0) {
      unitPrice = product.price;
    } else if (product.max_price && product.max_price > 0) {
      unitPrice = product.max_price;
    }

    // Validate price
    if (unitPrice <= 0) {
      toast({ 
        title: 'Prezzo non disponibile', 
        description: 'Il prodotto selezionato non ha un prezzo valido',
        variant: 'destructive' 
      });
      return;
    }

    // Add non-serialized product
    const saleItem = {
      product_id: product.id,
      product_name: `${product.brand} ${product.model}`,
      brand: product.brand,
      model: product.model,
      year: product.year,
      quantity: 1,
      unit_price: unitPrice,
      min_price: product.min_price,
      max_price: product.max_price,
      has_serial: product.has_serial || false,
      stock: product.stock || 0
    };

    console.log('🛒 Adding sale item:', saleItem);
    addItem(saleItem);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Handle unit selection for serialized products
  const handleUnitSelect = (product: Product, unit: any) => {
    // Use the specific unit's price if available, otherwise fall back to product pricing
    let unitPrice = 0;

    if (unit.price && unit.price > 0) {
      unitPrice = unit.price;
    } else if (product.max_price && product.max_price > 0) {
      unitPrice = product.max_price;
    } else if (product.price > 0) {
      unitPrice = product.price;
    }

    // Validate price
    if (unitPrice <= 0) {
      toast({ 
        title: 'Prezzo non disponibile', 
        description: 'L\'unità selezionata non ha un prezzo valido',
        variant: 'destructive' 
      });
      return;
    }

    const saleItem = {
      product_id: product.id,
      product_unit_id: unit.id,
      product_name: `${product.brand} ${product.model}`,
      brand: product.brand,
      model: product.model,
      year: product.year,
      quantity: 1,
      unit_price: unitPrice,
      min_price: product.min_price,
      max_price: product.max_price,
      serial_number: unit.serial_number,
      barcode: unit.barcode,
      has_serial: true,
      stock: 1
    };

    console.log('🛒 Adding serialized sale item:', saleItem);
    addItem(saleItem);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Aggiungi Prodotti
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Cerca per nome, IMEI o ultime 4 cifre..."
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <QrCode className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center text-muted-foreground py-4">
            Ricerca in corso...
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {searchResults.map((product) => {
              const availableUnits = product.product_units?.filter(unit => unit.status === 'available') || [];
              const hasAvailableStock = product.has_serial ? availableUnits.length > 0 : product.stock > 0;
              
              return (
                <div key={product.id} className="space-y-2">
                  {/* Product Header */}
                  <div
                    className={`p-3 border rounded-lg ${
                      !hasAvailableStock ? 'opacity-50' : 'cursor-pointer hover:bg-muted/50'
                    } transition-colors`}
                    onClick={() => !product.has_serial && hasAvailableStock && handleProductSelect(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">
                            {product.brand} {product.model}
                            {product.year && ` (${product.year})`}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={hasAvailableStock ? "default" : "destructive"}
                            >
                              {product.has_serial 
                                ? `${availableUnits.length} unità`
                                : `${product.stock} pz`
                              }
                            </Badge>
                            {product.has_serial && (
                              <Badge variant="outline">
                                <Smartphone className="h-3 w-3 mr-1" />
                                Con IMEI
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {(() => {
                          const pricingInfo = getProductPricingInfoSync({
                            price: product.price || 0,
                            has_serial: product.has_serial || false,
                            min_price: product.min_price,
                            max_price: product.max_price
                          });
                          return (
                            <div className="font-semibold">
                              {pricingInfo.display}
                            </div>
                          );
                        })()}
                        {!hasAvailableStock && (
                          <div className="text-xs text-destructive mt-1">
                            Non disponibile
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Units List for Serialized Products */}
                  {product.has_serial && availableUnits.length > 0 && (
                    <div className="ml-8 space-y-1">
                      {availableUnits.map((unit) => (
                        <div
                          key={unit.id}
                          className="p-2 bg-muted/30 rounded border cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleUnitSelect(product, unit)}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                IMEI: {unit.serial_number}
                              </Badge>
                              {unit.barcode && (
                                <Badge variant="outline" className="text-xs">
                                  {unit.barcode}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {unit.price && unit.price > 0 && (
                                <span className="text-xs font-semibold">
                                  €{unit.price.toFixed(2)}
                                </span>
                              )}
                              <Button size="sm" variant="ghost" className="h-6 text-xs">
                                Seleziona
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* No Results */}
        {searchTerm.length >= 2 && !isLoading && searchResults.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nessun prodotto trovato per "{searchTerm}"</p>
            <p className="text-sm mt-1">
              Prova a cercare con nome, IMEI o scansiona il codice a barre
            </p>
          </div>
        )}

        {/* Search Instructions */}
        {!searchTerm && searchResults.length === 0 && (
          <div className="text-center text-muted-foreground space-y-2 py-4">
            <Package className="h-8 w-8 mx-auto opacity-50" />
            <p className="font-medium">Cerca il prodotto da vendere</p>
            <div className="text-sm space-y-1">
              <p>• Digita il nome del prodotto</p>
              <p>• Inserisci IMEI completo o ultime 4 cifre</p>
              <p>• Usa lo scanner per il codice a barre</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}