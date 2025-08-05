import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface DiscountManagerProps {
  subtotal: number;
  discountType: 'percentage' | 'amount' | null;
  discountValue: number;
  onDiscountChange: (type: 'percentage' | 'amount' | null, value: number) => void;
}

export function DiscountManager({ 
  subtotal, 
  discountType, 
  discountValue, 
  onDiscountChange 
}: DiscountManagerProps) {
  const maxDiscountPercentage = 50; // 50% max discount
  const maxDiscountAmount = subtotal * 0.8; // Max 80% of subtotal

  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue) / 100
    : discountType === 'amount' 
    ? discountValue 
    : 0;

  const handleDiscountTypeChange = (type: string) => {
    if (type === 'none') {
      onDiscountChange(null, 0);
    } else {
      onDiscountChange(type as 'percentage' | 'amount', 0);
    }
  };

  const handleDiscountValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    
    if (discountType === 'percentage') {
      const clampedValue = Math.min(numValue, maxDiscountPercentage);
      onDiscountChange(discountType, clampedValue);
    } else if (discountType === 'amount') {
      const clampedValue = Math.min(numValue, maxDiscountAmount);
      onDiscountChange(discountType, clampedValue);
    }
  };

  const clearDiscount = () => {
    onDiscountChange(null, 0);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium text-orange-900">Sconto</Label>
        {discountType && discountAmount > 0 && (
          <Badge variant="secondary" className="bg-orange-200 text-orange-800">
            -€{discountAmount.toFixed(2)}
            <button
              onClick={clearDiscount}
              className="ml-2 text-orange-600 hover:text-orange-800"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo di Sconto</Label>
          <Select 
            value={discountType || 'none'} 
            onValueChange={handleDiscountTypeChange}
          >
            <SelectTrigger className="h-12 text-base touch-manipulation">
              <SelectValue placeholder="Seleziona tipo sconto" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="none" className="h-12 text-base touch-manipulation">Nessuno Sconto</SelectItem>
              <SelectItem value="percentage" className="h-12 text-base touch-manipulation">Percentuale (%)</SelectItem>
              <SelectItem value="amount" className="h-12 text-base touch-manipulation">Importo Fisso (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {discountType && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {discountType === 'percentage' ? 'Percentuale' : 'Importo'} Sconto
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={discountValue || ''}
                onChange={(e) => handleDiscountValueChange(e.target.value)}
                placeholder={discountType === 'percentage' ? '0' : '0.00'}
                step={discountType === 'percentage' ? '1' : '0.01'}
                min="0"
                max={discountType === 'percentage' ? maxDiscountPercentage : maxDiscountAmount}
                className="h-12 text-base touch-manipulation pr-10"
                inputMode={discountType === 'percentage' ? 'numeric' : 'decimal'}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base text-muted-foreground pointer-events-none">
                {discountType === 'percentage' ? '%' : '€'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              {discountType === 'percentage' && (
                <p>Massimo {maxDiscountPercentage}% (€{((subtotal * maxDiscountPercentage) / 100).toFixed(2)})</p>
              )}
              {discountType === 'amount' && (
                <p>Massimo €{maxDiscountAmount.toFixed(2)}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {discountAmount > 0 && (
        <div className="p-3 bg-orange-100 rounded border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-orange-900">Sconto Applicato:</span>
            <span className="text-lg font-bold text-orange-800">-€{discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-orange-700">Nuovo Totale:</span>
            <span className="text-lg font-bold text-green-700">€{(subtotal - discountAmount).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}