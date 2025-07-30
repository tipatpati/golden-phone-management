
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
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm sm:text-base leading-tight truncate">
                  {item.product_name}
                </h4>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.product_id)}
                className="h-8 w-8 p-0 shrink-0 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                aria-label="Rimuovi articolo"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Main content grid - responsive layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Quantity Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quantità
                  </Label>
                  {(() => {
                    const availableStock = getProductStock(item.product_id);
                    return (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        availableStock > 10 ? 'bg-green-100 text-green-700' : 
                        availableStock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {availableStock} disponibili
                      </span>
                    );
                  })()}
                </div>
                {(() => {
                  const availableStock = getProductStock(item.product_id);
                  const hasStockWarning = item.quantity > availableStock;
                  
                  return (
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="number"
                          min="1"
                          max={availableStock}
                          value={item.quantity}
                          onChange={(e) => onQuantityUpdate(item.product_id, parseInt(e.target.value) || 0)}
                          className={`h-10 text-center font-medium ${
                            hasStockWarning ? "border-destructive focus:border-destructive bg-destructive/5" : "bg-background"
                          }`}
                        />
                      </div>
                      {hasStockWarning && (
                        <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                          <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                          <span className="text-xs text-destructive leading-tight">
                            Eccedenza di {item.quantity - availableStock} unità
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Price Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Prezzo Unitario
                  </Label>
                  {item.min_price && item.max_price && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      €{item.min_price} - €{item.max_price}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      min={item.min_price || 0}
                      max={item.max_price || undefined}
                      value={item.unit_price}
                      onChange={(e) => onPriceUpdate(item.product_id, parseFloat(e.target.value) || 0)}
                      className={`h-10 pl-7 font-medium ${
                        item.min_price && item.max_price && 
                        (item.unit_price < item.min_price || item.unit_price > item.max_price)
                          ? "border-destructive focus:border-destructive bg-destructive/5" 
                          : "bg-background"
                      }`}
                    />
                  </div>
                  {item.min_price && item.max_price && 
                   (item.unit_price < item.min_price || item.unit_price > item.max_price) && (
                    <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                      <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
                      <span className="text-xs text-destructive leading-tight">
                        Prezzo fuori range (€{item.min_price} - €{item.max_price})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Serial Number Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Numero di Serie
                  </Label>
                  <span className="text-xs text-muted-foreground">Opzionale</span>
                </div>
                <Input
                  placeholder="Inserisci numero di serie..."
                  value={item.serial_number || ""}
                  onChange={(e) => onSerialNumberUpdate(item.product_id, e.target.value)}
                  className="h-10 font-mono text-sm bg-background"
                />
              </div>
            </div>

            {/* Footer with total */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border bg-muted/30 -mx-4 sm:-mx-5 px-4 sm:px-5 py-3 rounded-b-lg">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Subtotale</span>
                <span className="text-sm text-muted-foreground">{item.quantity} × €{item.unit_price.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-foreground">
                  €{(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
