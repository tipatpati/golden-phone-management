import React, { useState } from 'react';
import { Button } from '@/components/ui/updated-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Search } from 'lucide-react';
import type { NewPurchaseItem } from '@/services/sales/exchanges/types';
import { SalesProductService } from '@/services/sales/SalesProductService';
import type { Product } from '@/services/inventory/types';

interface ExchangeStepPurchaseProps {
  items: NewPurchaseItem[];
  onItemsChange: (items: NewPurchaseItem[]) => void;
}

export function ExchangeStepPurchase({
  items,
  onItemsChange,
}: ExchangeStepPurchaseProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [serialNumber, setSerialNumber] = useState('');

  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await SalesProductService.getProductsForSales(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
    performSearch(value);
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleUnitSelect = (product: Product, unit: any) => {
    const newItem: NewPurchaseItem = {
      product_id: product.id,
      product_unit_id: unit.id,
      brand: product.brand,
      model: product.model,
      quantity: 1,
      unit_price: unit.price || product.price,
      total_price: unit.price || product.price,
      serial_number: unit.serial_number,
    };

    onItemsChange([...items, newItem]);

    // Reset
    setSelectedProduct(null);
    setSearchTerm('');
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const newItem: NewPurchaseItem = {
      product_id: selectedProduct.id,
      brand: selectedProduct.brand,
      model: selectedProduct.model,
      quantity: selectedProduct.has_serial ? 1 : quantity,
      unit_price: selectedProduct.price,
      total_price: selectedProduct.price * (selectedProduct.has_serial ? 1 : quantity),
      serial_number: selectedProduct.has_serial ? serialNumber : undefined,
    };

    onItemsChange([...items, newItem]);

    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setSerialNumber('');
  };

  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const totalPurchase = items.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Articoli da Acquistare</h3>
        <p className="text-sm text-muted-foreground">
          Seleziona i prodotti che il cliente desidera acquistare.
        </p>
      </div>

      {/* Product Search */}
      {!selectedProduct && (
        <Card className="p-4 space-y-4">
          <div>
            <Label>Cerca Prodotto *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="Cerca per nome, marca, modello..."
                className="pl-10"
              />
            </div>
          </div>

          {isLoading && (
            <div className="text-center text-muted-foreground py-4">
              Ricerca in corso...
            </div>
          )}

          {searchTerm.length >= 2 && !isLoading && searchResults.length > 0 && (
            <div className="space-y-3">
              {searchResults.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-lg">
                        {product.brand} {product.model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {!product.has_serial && `Stock: ${product.stock} • `}
                        Prezzo base: €{product.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Show units for serialized products */}
                    {product.has_serial && product.product_units && product.product_units.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Unità disponibili ({product.product_units.length}):
                        </p>
                        <div className="space-y-2">
                          {product.product_units
                            .filter((unit: any) => unit.status === 'available')
                            .map((unit: any) => {
                              const matchesSearch = searchTerm.length >= 4 && 
                                unit.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
                              
                              return (
                                <div
                                  key={unit.id}
                                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all ${
                                    matchesSearch ? 'ring-2 ring-primary shadow-lg' : ''
                                  }`}
                                  onClick={() => handleUnitSelect(product, unit)}
                                >
                                  <div className="flex-1">
                                    <div className="font-mono text-sm font-semibold">
                                      {unit.serial_number || unit.barcode}
                                    </div>
                                    {unit.color && (
                                      <div className="text-xs text-muted-foreground">
                                        Colore: {unit.color}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-primary">
                                      €{(unit.price || product.price).toFixed(2)}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="mt-1"
                                    >
                                      Seleziona
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      /* Non-serialized product - show add button */
                      <Button
                        onClick={() => handleSelectProduct(product)}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Seleziona Prodotto
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && !isLoading && searchResults.length === 0 && (
            <div className="border rounded-lg p-4 text-center text-muted-foreground">
              Nessun prodotto trovato per "{searchTerm}"
            </div>
          )}

          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <div className="text-sm text-muted-foreground">
              Inserisci almeno 2 caratteri per cercare
            </div>
          )}
        </Card>
      )}

      {/* Selected Product Form */}
      {selectedProduct && (
        <Card className="p-4 space-y-4">
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <div className="font-semibold">
              {selectedProduct.brand} {selectedProduct.model}
            </div>
            <div className="text-sm text-muted-foreground">
              Prezzo unitario: €{selectedProduct.price.toFixed(2)}
            </div>

            {!selectedProduct.has_serial ? (
              <div>
                <Label>Quantità</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Stock disponibile: {selectedProduct.stock}
                </div>
              </div>
            ) : (
              <div>
                <Label>Numero di Serie *</Label>
                <Input
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Inserisci numero di serie..."
                />
              </div>
            )}

            <div className="font-semibold text-lg">
              Totale: €{(selectedProduct.price * (selectedProduct.has_serial ? 1 : quantity)).toFixed(2)}
            </div>

            <Button
              onClick={handleAddProduct}
              disabled={selectedProduct.has_serial && !serialNumber}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Aggiungi al Carrello
            </Button>
          </div>
        </Card>
      )}

      {/* Purchase Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label>Carrello ({items.length} articoli)</Label>
          {items.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-base">
                    {item.brand} {item.model}
                  </div>
                  {item.serial_number && (
                    <div className="font-mono text-sm text-muted-foreground">
                      S/N/IMEI: {item.serial_number}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Quantità: {item.quantity} × €{item.unit_price.toFixed(2)}
                  </div>
                  <div className="font-semibold text-lg text-primary">
                    €{item.total_price.toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}

          <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg font-semibold text-lg">
            <span>Totale Acquisto:</span>
            <span className="text-primary">€{totalPurchase.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
