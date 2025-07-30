
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertTriangle } from "lucide-react";
import { useProducts } from "@/services/useProducts";

type SaleItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  min_price?: number;
  max_price?: number;
  serial_number?: string;
};

type SaleItemsListProps = {
  saleItems: SaleItem[];
  onQuantityUpdate: (productId: string, quantity: number) => void;
  onPriceUpdate: (productId: string, price: number) => void;
  onSerialNumberUpdate: (productId: string, serialNumber: string) => void;
  onRemoveItem: (productId: string) => void;
};

export function SaleItemsList({ 
  saleItems, 
  onQuantityUpdate, 
  onPriceUpdate, 
  onSerialNumberUpdate, 
  onRemoveItem 
}: SaleItemsListProps) {
  // Fetch all products to get current stock information
  const { data: allProducts = [] } = useProducts();
  
  // Helper function to get product stock
  const getProductStock = (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    return product?.stock || 0;
  };

  if (saleItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium text-foreground">Articoli Vendita</Label>
      <div className="space-y-3">
        {saleItems.map((item) => (
          <div 
            key={item.product_id} 
            className="border border-border rounded-lg p-4 sm:p-5 bg-card shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header with product name and remove button */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h4 className="font-medium text-foreground text-sm sm:text-base leading-tight">
                  {item.product_name}
                </h4>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.product_id)}
                className="h-8 w-8 p-0 shrink-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Main content grid - responsive layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Quantity Section */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quantità
                </Label>
                {(() => {
                  const availableStock = getProductStock(item.product_id);
                  const hasStockWarning = item.quantity > availableStock;
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Disponibile:
                        </span>
                        <span className={`text-xs font-medium ${
                          availableStock > 10 ? 'text-green-600' : 
                          availableStock > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {availableStock}
                        </span>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max={availableStock}
                        value={item.quantity}
                        onChange={(e) => onQuantityUpdate(item.product_id, parseInt(e.target.value) || 0)}
                        className={`h-9 ${hasStockWarning ? "border-destructive focus:border-destructive" : ""}`}
                      />
                      {hasStockWarning && (
                        <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
                          <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                          <span className="text-xs text-destructive leading-tight">
                            Supera la scorta disponibile di {item.quantity - availableStock}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Price Section */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Prezzo Unitario
                </Label>
                <div className="space-y-2">
                  {item.min_price && item.max_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Range:</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        ${item.min_price} - ${item.max_price}
                      </span>
                    </div>
                  )}
                  <Input
                    type="number"
                    step="0.01"
                    min={item.min_price || 0}
                    max={item.max_price || undefined}
                    value={item.unit_price}
                    onChange={(e) => onPriceUpdate(item.product_id, parseFloat(e.target.value) || 0)}
                    className={`h-9 ${
                      item.min_price && item.max_price && 
                      (item.unit_price < item.min_price || item.unit_price > item.max_price)
                        ? "border-destructive focus:border-destructive" 
                        : ""
                    }`}
                  />
                  {item.min_price && item.max_price && 
                   (item.unit_price < item.min_price || item.unit_price > item.max_price) && (
                    <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md">
                      <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                      <span className="text-xs text-destructive leading-tight">
                        Il prezzo deve essere tra ${item.min_price} - ${item.max_price}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Serial Number Section */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Numero di Serie
                </Label>
                <Input
                  placeholder="Opzionale"
                  value={item.serial_number || ""}
                  onChange={(e) => onSerialNumberUpdate(item.product_id, e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Footer with total */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Subtotale articolo:</span>
              <span className="text-base font-semibold text-foreground">
                ${(item.unit_price * item.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
