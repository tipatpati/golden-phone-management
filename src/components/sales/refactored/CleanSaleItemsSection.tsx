import React, { useState } from 'react';
import { Minus, Plus, Trash2, Package, AlertTriangle, RefreshCw, Percent, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSaleCreation } from '@/contexts/SaleCreationContext';
import { toast } from 'sonner';

export function CleanSaleItemsSection() {
  const { state, updateItem, removeItem, refreshStock } = useSaleCreation();
  const { items } = state;
  const [openDiscountPopover, setOpenDiscountPopover] = useState<string | null>(null);

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

  const handleUpdateDiscount = (
    item: typeof items[0], 
    discountType: 'percentage' | 'amount' | null, 
    discountValue: number
  ) => {
    // Calculate discount amount
    const itemSubtotal = item.quantity * item.unit_price;
    let discountAmount = 0;
    
    if (discountType && discountValue > 0) {
      if (discountType === 'percentage') {
        discountAmount = (itemSubtotal * discountValue) / 100;
      } else {
        discountAmount = Math.min(discountValue, itemSubtotal);
      }
    }
    
    // Update item but keep popover open by maintaining the key
    const itemKey = `${item.product_id}-${item.product_unit_id || ''}-${item.serial_number || ''}`;
    updateItem(
      item.product_id, 
      { discount_type: discountType, discount_value: discountValue, discount_amount: discountAmount },
      item.serial_number, 
      item.product_unit_id
    );
    
    // Keep popover open after update
    setTimeout(() => {
      setOpenDiscountPopover(itemKey);
    }, 0);
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
              <div className="grid grid-cols-1 lg:grid-cols-13 gap-4 items-center">
                {/* Product Info - 4 columns */}
                <div className="lg:col-span-4">
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
                  <div className="space-y-1">
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleUpdatePrice(item, parseFloat(e.target.value) || 0)}
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
                      placeholder="Numero seriale"
                      className="h-8 text-sm font-mono"
                      readOnly
                      disabled
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>

                {/* Discount & Total - 3 columns */}
                <div className="lg:col-span-3 flex items-center gap-2">
                  {/* Discount Popover */}
                  <Popover 
                    open={openDiscountPopover === itemKey} 
                    onOpenChange={(open) => setOpenDiscountPopover(open ? itemKey : null)}
                    modal={false}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        size="sm"
                        variant={item.discount_type ? "default" : "outline"}
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.discount_type === 'percentage' ? (
                          <Percent className="h-3 w-3" />
                        ) : item.discount_type === 'amount' ? (
                          <Euro className="h-3 w-3" />
                        ) : (
                          <Percent className="h-3 w-3" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-80 bg-popover z-50" 
                      align="end"
                      onInteractOutside={(e) => {
                        // Only close when clicking truly outside, not on form elements
                        const target = e.target as HTMLElement;
                        if (target.closest('[role="dialog"]') || target.closest('[data-radix-popper-content-wrapper]')) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h4 className="font-medium">Sconto Articolo</h4>
                        
                        <RadioGroup 
                          value={item.discount_type || 'none'} 
                          onValueChange={(value) => {
                            if (value === 'none') {
                              handleUpdateDiscount(item, null, 0);
                            } else {
                              handleUpdateDiscount(item, value as 'percentage' | 'amount', item.discount_value || 0);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id={`none-${itemKey}`} />
                            <Label htmlFor={`none-${itemKey}`}>Nessuno sconto</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percentage" id={`percentage-${itemKey}`} />
                            <Label htmlFor={`percentage-${itemKey}`}>Percentuale (%)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="amount" id={`amount-${itemKey}`} />
                            <Label htmlFor={`amount-${itemKey}`}>Importo (€)</Label>
                          </div>
                        </RadioGroup>

                        {item.discount_type && (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <Label>Valore Sconto</Label>
                            <Input
                              type="number"
                              value={item.discount_value || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                handleUpdateDiscount(item, item.discount_type || 'percentage', value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              step="0.01"
                              min="0"
                              max={item.discount_type === 'percentage' ? 100 : undefined}
                            />
                            <p className="text-xs text-muted-foreground">
                              Sconto: €{itemDiscountAmount.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Total Price */}
                  <div className="flex-1 text-right">
                    {item.discount_type && itemDiscountAmount > 0 && (
                      <div className="text-xs text-muted-foreground line-through">
                        €{itemSubtotal.toFixed(2)}
                      </div>
                    )}
                    <div className="font-semibold text-sm">€{totalPrice.toFixed(2)}</div>
                  </div>

                  {/* Delete Button */}
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