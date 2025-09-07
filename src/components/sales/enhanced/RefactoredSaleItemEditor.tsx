import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  X, 
  Minus, 
  Plus, 
  AlertTriangle, 
  Package,
  Hash,
  DollarSign,
  ShoppingCart
} from "lucide-react";
import { SmartSerialInput } from "./SmartSerialInput";
import { useSaleForm } from "./SaleFormProvider";
import type { SaleItem } from "@/hooks/useSaleFormState";

interface SaleItemEditorProps {
  item: SaleItem;
}

export function RefactoredSaleItemEditor({ item }: SaleItemEditorProps) {
  const {
    getStock,
    updateItemQuantity,
    updateItemPrice,
    updateItemSerial,
    removeItem
  } = useSaleForm();
  
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState((item.unit_price || 0).toString());

  const availableStock = getStock(item.product_id);
  const hasStockWarning = item.quantity > availableStock;
  const hasPriceWarning = item.min_price && item.max_price && 
    (item.unit_price < item.min_price || item.unit_price > (item.max_price * 1.2));
  
  const subtotal = item.quantity * (item.unit_price || 0);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, item.quantity + delta);
    updateItemQuantity(item.product_id, newQuantity);
  };

  const handlePriceChange = (newPrice: string) => {
    setTempPrice(newPrice);
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price > 0) {
      updateItemPrice(item.product_id, price);
    }
  };

  const handlePriceBlur = () => {
    setIsEditingPrice(false);
    const price = parseFloat(tempPrice);
    if (isNaN(price) || price <= 0) {
      setTempPrice((item.unit_price || 0).toString());
    }
  };

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value) || 1;
    updateItemQuantity(item.product_id, quantity);
  };

  const handleSerialUpdate = (serialNumber: string) => {
    updateItemSerial(item.product_id, serialNumber);
  };

  const handleRemove = () => {
    removeItem(item.product_id);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <h4 className="font-semibold text-base">{item.product_name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={availableStock > 10 ? "default" : availableStock > 0 ? "secondary" : "destructive"}>
                  {availableStock} disponibili
                </Badge>
                {item.serial_number && (
                  <Badge variant="outline">
                    <Hash className="h-3 w-3 mr-1" />
                    {item.serial_number.slice(-4)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Warnings */}
        {(hasStockWarning || hasPriceWarning) && (
          <div className="p-3 bg-amber-50 border-b border-amber-200">
            {hasStockWarning && (
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Quantità superiore al disponibile ({item.quantity - availableStock} in eccesso)
                </span>
              </div>
            )}
            {hasPriceWarning && (
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Prezzo consigliato: €{item.min_price} - €{item.max_price}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Quantity Control */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Quantità</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(-1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-16 text-center">
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={handleQuantityInputChange}
                  className="h-8 text-center text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleQuantityChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Price Control */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Prezzo Unitario</Label>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {isEditingPrice ? (
                <Input
                  type="number"
                  step="0.01"
                  value={tempPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onBlur={handlePriceBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handlePriceBlur()}
                  className="w-24 h-8 text-right text-sm"
                  autoFocus
                />
              ) : (
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-sm font-mono"
                  onClick={() => setIsEditingPrice(true)}
                >
                  €{(item.unit_price || 0).toFixed(2)}
                </Button>
              )}
            </div>
          </div>

          {/* Serial Number */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">IMEI/Serial (Opzionale)</Label>
            <SmartSerialInput
              productId={item.product_id}
              value={item.serial_number || ""}
              onSerialNumberUpdate={handleSerialUpdate}
            />
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between pt-3 border-t bg-muted/20 -mx-4 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {item.quantity} × €{(item.unit_price || 0).toFixed(2)}
              </span>
            </div>
            <div className="text-lg font-bold">
              €{subtotal.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}