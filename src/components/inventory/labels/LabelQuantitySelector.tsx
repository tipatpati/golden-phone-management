/**
 * Label Quantity Selector for Non-Serialized Products
 * Allows users to specify how many labels to print for bulk products
 */

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/updated-button";
import { Plus, Minus } from "lucide-react";
import { ThermalLabelData } from "./types";

interface LabelQuantityItem {
  label: ThermalLabelData;
  quantity: number;
}

interface LabelQuantitySelectorProps {
  labels: ThermalLabelData[];
  onQuantitiesChange: (items: LabelQuantityItem[]) => void;
}

export function LabelQuantitySelector({ 
  labels, 
  onQuantitiesChange 
}: LabelQuantitySelectorProps) {
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    labels.forEach(label => {
      const key = label.id || label.productName;
      initial[key] = 1; // Default to 1 label per product
    });
    return initial;
  });

  React.useEffect(() => {
    const items: LabelQuantityItem[] = labels.map(label => {
      const key = label.id || label.productName;
      return {
        label,
        quantity: quantities[key] || 1
      };
    });
    onQuantitiesChange(items);
  }, [quantities, labels, onQuantitiesChange]);

  const updateQuantity = (labelKey: string, newQuantity: number) => {
    const validQuantity = Math.max(1, Math.min(100, newQuantity)); // Between 1 and 100
    setQuantities(prev => ({
      ...prev,
      [labelKey]: validQuantity
    }));
  };

  const increment = (labelKey: string) => {
    setQuantities(prev => ({
      ...prev,
      [labelKey]: Math.min((prev[labelKey] || 1) + 1, 100)
    }));
  };

  const decrement = (labelKey: string) => {
    setQuantities(prev => ({
      ...prev,
      [labelKey]: Math.max((prev[labelKey] || 1) - 1, 1)
    }));
  };

  return (
    <div className="space-y-3">
      <Label>Label Quantities (Non-Serialized Products)</Label>
      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
        {labels.map((label) => {
          const key = label.id || label.productName;
          const quantity = quantities[key] || 1;

          return (
            <div 
              key={key} 
              className="flex items-center justify-between gap-3 p-2 rounded bg-muted/30"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{label.productName}</p>
                {label.barcode && (
                  <p className="text-xs text-muted-foreground">{label.barcode}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  onClick={() => decrement(key)}
                  disabled={quantity <= 1}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 1)}
                  className="w-16 h-8 text-center"
                />
                
                <Button
                  type="button"
                  variant="outlined"
                  size="sm"
                  onClick={() => increment(key)}
                  disabled={quantity >= 100}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Total labels: {Object.values(quantities).reduce((sum, qty) => sum + qty, 0)}
      </p>
    </div>
  );
}
