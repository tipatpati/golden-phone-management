
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
      <Label>Articoli Vendita</Label>
      <div className="space-y-2">
        {saleItems.map((item) => (
          <div key={item.product_id} className="border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{item.product_name}</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.product_id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Quantità</Label>
                {(() => {
                  const availableStock = getProductStock(item.product_id);
                  const hasStockWarning = item.quantity > availableStock;
                  
                  return (
                    <>
                      <div className="text-xs text-muted-foreground mb-1">
                        Disponibile: {availableStock}
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max={availableStock}
                        value={item.quantity}
                        onChange={(e) => onQuantityUpdate(item.product_id, parseInt(e.target.value) || 0)}
                        className={hasStockWarning ? "border-red-500" : ""}
                      />
                      {hasStockWarning && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-500">
                            Supera la scorta disponibile di {item.quantity - availableStock}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div>
                <Label className="text-xs">Prezzo Unitario</Label>
                {item.min_price && item.max_price && (
                  <div className="text-xs text-muted-foreground mb-1">
                    Range: ${item.min_price} - ${item.max_price}
                  </div>
                )}
                <Input
                  type="number"
                  step="0.01"
                  min={item.min_price || 0}
                  max={item.max_price || undefined}
                  value={item.unit_price}
                  onChange={(e) => onPriceUpdate(item.product_id, parseFloat(e.target.value) || 0)}
                  className={
                    item.min_price && item.max_price && 
                    (item.unit_price < item.min_price || item.unit_price > item.max_price)
                      ? "border-red-500" 
                      : ""
                  }
                />
                {item.min_price && item.max_price && 
                 (item.unit_price < item.min_price || item.unit_price > item.max_price) && (
                  <div className="text-xs text-red-500 mt-1">
                    Il prezzo deve essere tra ${item.min_price} - ${item.max_price}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs">Numero di Serie</Label>
                <Input
                  placeholder="Opzionale"
                  value={item.serial_number || ""}
                  onChange={(e) => onSerialNumberUpdate(item.product_id, e.target.value)}
                />
              </div>
            </div>
            <div className="text-right mt-2 font-medium">
              Totale: ${(item.unit_price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
