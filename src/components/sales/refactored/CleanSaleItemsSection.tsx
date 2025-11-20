import React from 'react';
import { Minus, Plus, Trash2, Package, AlertTriangle, RefreshCw, Percent, Euro, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSaleCreation } from '@/contexts/SaleCreationContext';
import { toast } from 'sonner';

export function CleanSaleItemsSection() {
  const { state, updateItem, removeItem, refreshStock } = useSaleCreation();
  const { items } = state;

  const handleRefreshStock = async () => {
    const productIds = items.map(i => i.product_id);
    if (productIds.length === 0) return;
    
    toast.info('Aggiornamento stock in corso...');
    await refreshStock(productIds);
    toast.success('Stock aggiornato');
  };

  const handleUpdateQuantity = (item: typeof items[0], quantity: number) => {
    if (quantity <= 0) {
      removeItem(item.product_id);
      return;
    }

    // For serialized products, limit quantity to 1
    if (item.has_serial && quantity > 1) {
      toast.error('I prodotti serializzati non possono avere quantità maggiore di 1');
      return;
    }

    updateItem(item.product_id, { quantity }, item.serial_number, item.product_unit_id);
  };

  const handleUpdatePrice = (item: typeof items[0], price: number) => {
    updateItem(item.product_id, { unit_price: price }, item.serial_number, item.product_unit_id);
  };

  const handleUpdateSerial = (item: typeof items[0], serialNumber: string) => {
    updateItem(item.product_id, { serial_number: serialNumber }, item.serial_number, item.product_unit_id);
  };

  const handleDiscountPercentage = (item: typeof items[0], value: string) => {
    const percentValue = parseFloat(value) || 0;
    if (percentValue < 0 || percentValue > 100) return;
    
    const itemSubtotal = item.quantity * item.unit_price;
    const discountAmount = (itemSubtotal * percentValue) / 100;
    
    console.log('[DISCOUNT] Percentage update:', {
      productId: item.product_id,
      serialNumber: item.serial_number,
      productUnitId: item.product_unit_id,
      percentValue,
      discountAmount
    });
    
    updateItem(
      item.product_id,
      { 
        discount_type: 'percentage',
        discount_value: percentValue,
        discount_amount: discountAmount
      },
      item.serial_number,
      item.product_unit_id || undefined
    );
  };

  const handleDiscountAmount = (item: typeof items[0], value: string) => {
    const amountValue = parseFloat(value) || 0;
    const itemSubtotal = item.quantity * item.unit_price;
    if (amountValue < 0 || amountValue > itemSubtotal) return;
    
    console.log('[DISCOUNT] Amount update:', {
      productId: item.product_id,
      serialNumber: item.serial_number,
      productUnitId: item.product_unit_id,
      amountValue
    });
    
    updateItem(
      item.product_id,
      { 
        discount_type: 'amount',
        discount_value: amountValue,
        discount_amount: amountValue
      },
      item.serial_number,
      item.product_unit_id || undefined
    );
  };

  const clearDiscount = (item: typeof items[0]) => {
    console.log('[DISCOUNT] Clearing discount:', {
      productId: item.product_id,
      serialNumber: item.serial_number,
      productUnitId: item.product_unit_id
    });
    
    updateItem(
      item.product_id,
      { 
        discount_type: null,
        discount_value: 0,
        discount_amount: 0
      },
      item.serial_number,
      item.product_unit_id || undefined
    );
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-on-surface mb-2">Nessun prodotto aggiunto</h3>
        <p className="text-muted-foreground">
          Cerca e aggiungi prodotti per iniziare la garentille
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
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefreshStock}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Aggiorna Stock
          </Button>
          <Badge variant="secondary" className="text-xs">
            {items.length} {items.length === 1 ? 'prodotto' : 'prodotti'}
          </Badge>
        </div>
      </div>

      {/* Items Table-like Layout */}
      <div className="space-y-3">
        {items.map((item) => {
          const itemKey = `${item.product_id}-${item.product_unit_id || ''}-${item.serial_number || ''}`;
          const hasStockIssue = !item.has_serial && item.quantity > item.stock;
          const hasPriceIssue = item.unit_price < (item.min_price || 0) || item.unit_price > (item.max_price || 0);
          
          // Calculate item total with discount
          const itemSubtotal = item.quantity * item.unit_price;
          let itemDiscountAmount = 0;
          if (item.discount_type && item.discount_value && item.discount_value > 0) {
            if (item.discount_type === 'percentage') {
              itemDiscountAmount = (itemSubtotal * item.discount_value) / 100;
            } else {
              itemDiscountAmount = Math.min(item.discount_value, itemSubtotal);
            }
          }
          const totalPrice = itemSubtotal - itemDiscountAmount;

          return (
            <div
              key={itemKey}
              className={`p-4 bg-surface-container rounded-lg border transition-colors ${
                hasStockIssue || hasPriceIssue 
                  ? 'border-destructive/50 bg-destructive/5' 
                  : 'border-border/30'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Product Info - 3 columns */}
                <div className="lg:col-span-3">
                  <h3 className="font-medium text-on-surface text-sm truncate">{item.product_name}</h3>
                  {item.serial_number && (
                    <p className="text-xs text-muted-foreground mt-0.5">SN/IMEI: {item.serial_number}</p>
                  )}
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
                  <label className="text-xs text-muted-foreground mb-1 block">Quantità</label>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
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
                      onChange={(e) => handleUpdateQuantity(item, parseInt(e.target.value) || 1)}
                      className="h-8 w-16 text-center text-sm"
                      min="1"
                      disabled={item.has_serial}
                    />
                    <Button
                      onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
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
                  <label className="text-xs text-muted-foreground mb-1 block">Prezzo unitario</label>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleUpdatePrice(item, parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                    step="0.01"
                    min="0"
                  />
                  <div className="text-xs text-muted-foreground mt-0.5">
                    €{(item.min_price || 0).toFixed(2)} - €{(item.max_price || 0).toFixed(2)}
                  </div>
                </div>

                {/* Discount - 3 columns */}
                <div className="lg:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Sconto</label>
                    {(item.discount_type && (item.discount_value || 0) > 0) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => clearDiscount(item)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 flex-1">
                      <Percent className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        value={item.discount_type === 'percentage' ? (item.discount_value || '') : ''}
                        onChange={(e) => handleDiscountPercentage(item, e.target.value)}
                        className="h-8 w-full text-sm"
                        placeholder="0"
                        step="1"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <Euro className="h-3 w-3 text-muted-foreground" />
                      <Input
                        type="number"
                        value={item.discount_type === 'amount' ? (item.discount_value || '') : ''}
                        onChange={(e) => handleDiscountAmount(item, e.target.value)}
                        className="h-8 w-full text-sm"
                        placeholder="0"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  {itemDiscountAmount > 0 && (
                    <div className="text-xs text-primary mt-0.5">
                      -€{itemDiscountAmount.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Total & Actions - 2 columns */}
                <div className="lg:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Totale</label>
                  <div className="flex items-center gap-2">
                    <div className="text-right flex-1">
                      {itemDiscountAmount > 0 && (
                        <div className="text-xs text-muted-foreground line-through">
                          €{itemSubtotal.toFixed(2)}
                        </div>
                      )}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}