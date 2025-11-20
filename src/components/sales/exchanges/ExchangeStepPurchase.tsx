import React, { useState } from 'react';
import { Button } from '@/components/ui/updated-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { ProductSelector } from '../ProductSelector';
import type { NewPurchaseItem } from '@/services/sales/exchanges/types';

interface ExchangeStepPurchaseProps {
  items: NewPurchaseItem[];
  onItemsChange: (items: NewPurchaseItem[]) => void;
}

export function ExchangeStepPurchase({
  items,
  onItemsChange,
}: ExchangeStepPurchaseProps) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [serialNumber, setSerialNumber] = useState('');

  const handleAddProduct = () => {
    if (!selectedProduct) return;

    const newItem: NewPurchaseItem = {
      product_id: selectedProduct.id,
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

      {/* Product Selection */}
      <Card className="p-4 space-y-4">
        <div>
          <Label>Cerca Prodotto *</Label>
          <ProductSelector
            onProductAdd={setSelectedProduct}
            selectedCategory={undefined}
          />
        </div>

        {selectedProduct && (
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
        )}
      </Card>

      {/* Purchase Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label>Carrello ({items.length} articoli)</Label>
          {items.map((item, index) => (
            <Card key={index} className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold">Prodotto #{index + 1}</div>
                  <div className="text-sm text-muted-foreground">
                    Quantità: {item.quantity} × €{item.unit_price.toFixed(2)}
                  </div>
                  {item.serial_number && (
                    <div className="text-xs text-muted-foreground">
                      S/N: {item.serial_number}
                    </div>
                  )}
                  <div className="font-semibold text-blue-600 mt-1">
                    €{item.total_price.toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}

          <div className="flex justify-between items-center p-3 bg-muted rounded-lg font-semibold">
            <span>Totale Acquisto:</span>
            <span className="text-blue-600">€{totalPurchase.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
