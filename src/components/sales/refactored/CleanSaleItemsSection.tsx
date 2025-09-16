import React from 'react';
import { Minus, Plus, Trash2, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSaleCreation } from '@/contexts/SaleCreationContext';
import { toast } from 'sonner';

export function CleanSaleItemsSection() {
  const { state, updateItem, removeItem } = useSaleCreation();
  const { items } = state;

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const item = items.find(i => i.product_id === productId);
    if (!item) return;

    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    // For serialized products, limit quantity to 1
    if (item.has_serial && quantity > 1) {
      toast.error('I prodotti serializzati non possono avere quantità maggiore di 1');
      return;
    }

    updateItem(productId, { quantity });
  };

  const handleUpdatePrice = (productId: string, price: number) => {
    updateItem(productId, { unit_price: price });
  };

  const handleUpdateSerial = (productId: string, serialNumber: string) => {
    updateItem(productId, { serial_number: serialNumber });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-on-surface mb-2">Nessun prodotto aggiunto</h3>
        <p className="text-muted-foreground">
          Cerca e aggiungi prodotti per iniziare la vendita
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-on-surface">Prodotti Selezionati</h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          {items.length} {items.length === 1 ? 'prodotto' : 'prodotti'}
        </Badge>
      </div>

      {/* Items Table-like Layout */}
      <div className="space-y-3">
        {items.map((item) => {
          const hasStockIssue = !item.has_serial && item.quantity > item.stock;
          const hasPriceIssue = item.unit_price < (item.min_price || 0) || item.unit_price > (item.max_price || 0);
          const totalPrice = item.quantity * item.unit_price;

          return (
            <div
              key={`${item.product_id}-${item.product_unit_id || ''}`}
              className={`p-4 bg-surface-container rounded-lg border transition-colors ${
                hasStockIssue || hasPriceIssue 
                  ? 'border-destructive/50 bg-destructive/5' 
                  : 'border-border/30'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Product Info - 4 columns */}
                <div className="lg:col-span-4">
                  <h3 className="font-medium text-on-surface text-sm truncate">{item.product_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {hasStockIssue && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent>Stock insufficiente</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {hasPriceIssue && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          </TooltipTrigger>
                          <TooltipContent>Prezzo fuori range</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {item.has_serial && (
                      <Badge variant="outline" className="text-xs">Serializzato</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Stock: {item.stock}
                    </span>
                  </div>
                </div>

                {/* Quantity - 2 columns */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      disabled={item.has_serial}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                      className="h-8 w-16 text-center text-sm"
                      min="1"
                      disabled={item.has_serial}
                    />
                    <Button
                      onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      disabled={item.has_serial}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Unit Price - 2 columns */}
                <div className="lg:col-span-2">
                  <div className="space-y-1">
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleUpdatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm"
                      step="0.01"
                      min="0"
                    />
                    <div className="text-xs text-muted-foreground">
                      €{(item.min_price || 0).toFixed(2)} - €{(item.max_price || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Serial Number - 2 columns */}
                <div className="lg:col-span-2">
                  {item.has_serial ? (
                    <Input
                      type="text"
                      value={item.serial_number || ''}
                      onChange={(e) => handleUpdateSerial(item.product_id, e.target.value)}
                      placeholder="Numero seriale"
                      className="h-8 text-sm font-mono"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>

                {/* Total & Actions - 2 columns */}
                <div className="lg:col-span-2 flex items-center justify-between">
                  <div className="text-right">
                    <div className="font-semibold text-sm">€{totalPrice.toFixed(2)}</div>
                  </div>
                  <Button
                    onClick={() => removeItem(item.product_id)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}