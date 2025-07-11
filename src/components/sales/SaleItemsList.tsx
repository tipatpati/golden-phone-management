
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  if (saleItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Label>Sale Items</Label>
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
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onQuantityUpdate(item.product_id, parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label className="text-xs">Unit Price</Label>
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
                    Price must be between ${item.min_price} - ${item.max_price}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs">Serial Number</Label>
                <Input
                  placeholder="Optional"
                  value={item.serial_number || ""}
                  onChange={(e) => onSerialNumberUpdate(item.product_id, e.target.value)}
                />
              </div>
            </div>
            <div className="text-right mt-2 font-medium">
              Total: ${(item.unit_price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
