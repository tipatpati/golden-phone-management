import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Banknote, Building } from "lucide-react";

interface HybridPaymentManagerProps {
  totalAmount: number;
  cashAmount: number;
  cardAmount: number;
  bankTransferAmount: number;
  onPaymentChange: (type: 'cash' | 'card' | 'bank_transfer', amount: number) => void;
}

export function HybridPaymentManager({
  totalAmount,
  cashAmount,
  cardAmount,
  bankTransferAmount,
  onPaymentChange
}: HybridPaymentManagerProps) {
  // Calculate totals with proper 2-decimal precision
  const totalPaid = Number((Number(cashAmount) + Number(cardAmount) + Number(bankTransferAmount)).toFixed(2));
  const remainingAmount = Number((totalAmount - totalPaid).toFixed(2));
  const isFullyPaid = Math.abs(remainingAmount) < 0.005; // Use small tolerance for floating point precision

  const handleAmountChange = (type: 'cash' | 'card' | 'bank_transfer', value: string) => {
    const amount = Math.max(0, Math.min(parseFloat(value) || 0, totalAmount));
    // Ensure 2 decimal precision
    const roundedAmount = Number(amount.toFixed(2));
    onPaymentChange(type, roundedAmount);
  };

  const quickFillRemaining = (type: 'cash' | 'card' | 'bank_transfer') => {
    if (remainingAmount > 0) {
      // Calculate current total from other payment methods
      const currentOtherTotal = (type === 'cash' ? 0 : cashAmount) + 
                               (type === 'card' ? 0 : cardAmount) + 
                               (type === 'bank_transfer' ? 0 : bankTransferAmount);
      
      // Calculate the exact remaining amount with 2 decimal precision
      const exactRemaining = Number((totalAmount - currentOtherTotal).toFixed(2));
      
      // Ensure we don't exceed the total amount and round to 2 decimals
      const fillAmount = Math.max(0, Math.min(exactRemaining, totalAmount));
      const finalAmount = Number(fillAmount.toFixed(2));
      
      onPaymentChange(type, finalAmount);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Label className="text-lg font-semibold">Pagamento Ibrido</Label>
        <Badge 
          variant={isFullyPaid ? "default" : "destructive"}
          className={`text-sm px-3 py-1 ${isFullyPaid ? "bg-green-600" : ""}`}
        >
          {isFullyPaid ? "✓ Completato" : `Mancano €${remainingAmount.toFixed(2)}`}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Cash Payment */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Banknote className="h-6 w-6 text-green-600" />
            <Label className="text-lg font-semibold">Contanti</Label>
          </div>
          <div className="space-y-3">
            <Input
              type="number"
              value={cashAmount || ''}
              onChange={(e) => handleAmountChange('cash', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={totalAmount}
              className="h-12 text-lg touch-manipulation"
              inputMode="decimal"
            />
            {remainingAmount > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => quickFillRemaining('cash')}
                className="w-full h-10 text-sm touch-manipulation"
              >
                💰 Paga resto: €{remainingAmount.toFixed(2)}
              </Button>
            )}
          </div>
        </Card>

        {/* Card Payment */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <Label className="text-lg font-semibold">Carta</Label>
          </div>
          <div className="space-y-3">
            <Input
              type="number"
              value={cardAmount || ''}
              onChange={(e) => handleAmountChange('card', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={totalAmount}
              className="h-12 text-lg touch-manipulation"
              inputMode="decimal"
            />
            {remainingAmount > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => quickFillRemaining('card')}
                className="w-full h-10 text-sm touch-manipulation"
              >
                💳 Paga resto: €{remainingAmount.toFixed(2)}
              </Button>
            )}
          </div>
        </Card>

        {/* Bank Transfer Payment */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building className="h-6 w-6 text-purple-600" />
            <Label className="text-lg font-semibold">Bonifico Bancario</Label>
          </div>
          <div className="space-y-3">
            <Input
              type="number"
              value={bankTransferAmount || ''}
              onChange={(e) => handleAmountChange('bank_transfer', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={totalAmount}
              className="h-12 text-lg touch-manipulation"
              inputMode="decimal"
            />
            {remainingAmount > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => quickFillRemaining('bank_transfer')}
                className="w-full h-10 text-sm touch-manipulation"
              >
                🏦 Paga resto: €{remainingAmount.toFixed(2)}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Summary */}
      <div className="p-4 bg-gray-50 rounded border space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Totale da Pagare:</span>
          <span className="text-lg font-bold">€{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Totale Pagato:</span>
          <span className="text-lg font-semibold text-blue-600">€{totalPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm">Rimanente:</span>
          <span className={`text-lg font-semibold ${remainingAmount > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
            €{remainingAmount.toFixed(2)}
          </span>
        </div>
        
        {totalPaid > 0 && (
          <div className="pt-2 border-t space-y-1">
            {cashAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Contanti:</span>
                <span>€{cashAmount.toFixed(2)}</span>
              </div>
            )}
            {cardAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Carta:</span>
                <span>€{cardAmount.toFixed(2)}</span>
              </div>
            )}
            {bankTransferAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Bonifico:</span>
                <span>€{bankTransferAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}