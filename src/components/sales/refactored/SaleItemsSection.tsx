import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ShoppingCart, 
  Package, 
  X, 
  Plus, 
  Minus, 
  AlertTriangle 
} from 'lucide-react';
import { useSaleCreation } from '@/contexts/SaleCreationContext';
import { getSaleItemControlsState, isQuantityChangeValid } from '@/utils/saleItemsUtils';

export function SaleItemsSection() {
  const { state, updateItem, removeItem } = useSaleCreation();
  const { items } = state;

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const item = items.find(i => i.product_id === productId);
    if (!item) return;
    
    // Check if quantity change is valid for serialized products
    if (!isQuantityChangeValid(item.has_serial, quantity)) {
      return;
    }
    
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    updateItem(productId, { quantity });
  };

  const handleUpdatePrice = (productId: string, price: number) => {
    if (price <= 0) return;
    updateItem(productId, { unit_price: price });
  };

  const handleUpdateSerial = (productId: string, serialNumber: string) => {
    updateItem(productId, { serial_number: serialNumber });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Prodotti nella Vendita ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nessun prodotto aggiunto</p>
            <p className="text-sm mt-1">Cerca e aggiungi prodotti alla vendita</p>
          </div>
        ) : (
          items.map((item) => {
            const hasStockIssue = !item.has_serial && item.quantity > item.stock;
            const priceInRange = (!item.min_price || item.unit_price >= item.min_price) &&
                               (!item.max_price || item.unit_price <= item.max_price);
            const controlsState = getSaleItemControlsState(item.has_serial, item.serial_number);

            return (
              <Card key={item.product_id} className={`p-4 ${hasStockIssue ? 'border-destructive' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{item.product_name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {item.stock} disponibili
                      </Badge>
                      {hasStockIssue && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Stock insufficiente
                        </Badge>
                      )}
                      {!priceInRange && (
                        <Badge variant="secondary">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Prezzo fuori range
                        </Badge>
                      )}
                      {item.has_serial && (
                        <Badge variant="default">
                          Prodotto Serializzato
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeItem(item.product_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label>Quantità</Label>
                    <TooltipProvider>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                              disabled={controlsState.isQuantityDisabled}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          {controlsState.quantityTooltip && (
                            <TooltipContent>
                              <p>{controlsState.quantityTooltip}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                              className="h-8 text-center"
                              min="1"
                              disabled={controlsState.isQuantityDisabled}
                            />
                          </TooltipTrigger>
                          {controlsState.quantityTooltip && (
                            <TooltipContent>
                              <p>{controlsState.quantityTooltip}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                              disabled={controlsState.isQuantityDisabled}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          {controlsState.quantityTooltip && (
                            <TooltipContent>
                              <p>{controlsState.quantityTooltip}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label>Prezzo</Label>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleUpdatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                        className="h-8"
                      />
                      {(item.min_price || item.max_price) && (
                        <div className="text-xs text-muted-foreground">
                          {item.min_price && `Min: €${item.min_price}`}
                          {item.min_price && item.max_price && ' - '}
                          {item.max_price && `Max: €${item.max_price}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Serial */}
                  <div className="space-y-2">
                    <Label>Serial/IMEI</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Input
                              value={item.serial_number || ''}
                              onChange={(e) => handleUpdateSerial(item.product_id, e.target.value)}
                              placeholder={item.has_serial ? 'Richiesto' : 'Opzionale'}
                              className="h-8"
                              disabled={controlsState.isSerialDisabled}
                            />
                            {controlsState.isSerialDisabled && item.serial_number && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1 h-6 px-2 text-xs"
                                onClick={() => handleUpdateSerial(item.product_id, '')}
                              >
                                Rimuovi
                              </Button>
                            )}
                          </div>
                        </TooltipTrigger>
                        {controlsState.serialTooltip && (
                          <TooltipContent>
                            <p>{controlsState.serialTooltip}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Total */}
                  <div className="space-y-2">
                    <Label>Totale</Label>
                    <div className="h-8 flex items-center font-bold">
                      €{(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}