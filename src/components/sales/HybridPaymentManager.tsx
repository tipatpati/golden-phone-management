import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const totalPaid = cashAmount + cardAmount + bankTransferAmount;
  const remainingAmount = totalAmount - totalPaid;
  const isFullyPaid = Math.abs(remainingAmount) < 0.01;

  const handleAmountChange = (type: 'cash' | 'card' | 'bank_transfer', value: string) => {
    const amount = parseFloat(value) || 0;
    const clampedAmount = Math.max(0, Math.min(amount, totalAmount));
    onPaymentChange(type, clampedAmount);
  };

  const quickFillRemaining = (type: 'cash' | 'card' | 'bank_transfer') => {
    if (remainingAmount > 0) {
      onPaymentChange(type, remainingAmount);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Pagamento Ibrido</Label>
        <Badge 
          variant={isFullyPaid ? "default" : "destructive"}
          className={isFullyPaid ? "bg-green-600" : ""}
        >
          {isFullyPaid ? "Completato" : `Mancano €${remainingAmount.toFixed(2)}`}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash Payment */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            <Label className="font-medium">Contanti</Label>
          </div>
          <div className="space-y-2">
            <Input
              type="number"
              value={cashAmount}
              onChange={(e) => handleAmountChange('cash', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={totalAmount}
              className="h-10"
            />
            {remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => quickFillRemaining('cash')}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Paga resto con contanti (€{remainingAmount.toFixed(2)})
              </button>
            )}
          </div>
        </Card>

        {/* Card Payment */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <Label className="font-medium">Carta</Label>
          </div>
          <div className="space-y-2">
            <Input
              type="number"
              value={cardAmount}
              onChange={(e) => handleAmountChange('card', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={totalAmount}
              className="h-10"
            />
            {remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => quickFillRemaining('card')}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Paga resto con carta (€{remainingAmount.toFixed(2)})
              </button>
            )}
          </div>
        </Card>

        {/* Bank Transfer Payment */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-600" />
            <Label className="font-medium">Bonifico</Label>
          </div>
          <div className="space-y-2">
            <Input
              type="number"
              value={bankTransferAmount}
              onChange={(e) => handleAmountChange('bank_transfer', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={totalAmount}
              className="h-10"
            />
            {remainingAmount > 0 && (
              <button
                type="button"
                onClick={() => quickFillRemaining('bank_transfer')}
                className="text-xs text-purple-600 hover:text-purple-800 underline"
              >
                Paga resto con bonifico (€{remainingAmount.toFixed(2)})
              </button>
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