import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ExchangeCalculation } from '@/services/sales/exchanges/types';

interface ExchangeStepPaymentProps {
  calculation: ExchangeCalculation;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'hybrid';
  onPaymentMethodChange: (method: 'cash' | 'card' | 'bank_transfer' | 'hybrid') => void;
  cashAmount: number;
  onCashAmountChange: (amount: number) => void;
  cardAmount: number;
  onCardAmountChange: (amount: number) => void;
  bankTransferAmount: number;
  onBankTransferAmountChange: (amount: number) => void;
}

export function ExchangeStepPayment({
  calculation,
  paymentMethod,
  onPaymentMethodChange,
  cashAmount,
  onCashAmountChange,
  cardAmount,
  onCardAmountChange,
  bankTransferAmount,
  onBankTransferAmountChange,
}: ExchangeStepPaymentProps) {
  const totalPaid = cashAmount + cardAmount + bankTransferAmount;
  const isBalanced = Math.abs(totalPaid - Math.abs(calculation.net_difference)) < 0.01;

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Riepilogo Finanziario</h3>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-green-50 dark:bg-green-950/20">
          <div className="text-sm text-muted-foreground">Valore Permuta</div>
          <div className="text-2xl font-bold text-green-600">
            €{calculation.trade_in_total.toFixed(2)}
          </div>
        </Card>

        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="text-sm text-muted-foreground">Totale Acquisto</div>
          <div className="text-2xl font-bold text-blue-600">
            €{calculation.purchase_total.toFixed(2)}
          </div>
        </Card>

        <Card className="p-4 bg-purple-50 dark:bg-purple-950/20">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            {calculation.client_pays && <TrendingUp className="h-4 w-4 text-red-500" />}
            {calculation.client_receives && <TrendingDown className="h-4 w-4 text-green-500" />}
            Differenza
          </div>
          <div
            className={`text-2xl font-bold ${
              calculation.client_pays ? 'text-red-600' : calculation.client_receives ? 'text-green-600' : 'text-foreground'
            }`}
          >
            {calculation.even_exchange
              ? 'Cambio alla Pari'
              : `€${Math.abs(calculation.net_difference).toFixed(2)}`}
          </div>
        </Card>
      </div>

      {calculation.even_exchange && (
        <Alert className="bg-green-50 dark:bg-green-950/20 border-green-500">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Cambio alla pari! Non è richiesto alcun pagamento.
          </AlertDescription>
        </Alert>
      )}

      {calculation.client_pays && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Il cliente deve pagare €{Math.abs(calculation.net_difference).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {calculation.client_receives && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-500">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Il cliente riceverà €{Math.abs(calculation.net_difference).toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Method Selection */}
      {!calculation.even_exchange && calculation.client_pays && (
        <div className="space-y-4">
          <div>
            <Label>Metodo di Pagamento</Label>
            <Select value={paymentMethod} onValueChange={onPaymentMethodChange as any}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Contanti</SelectItem>
                <SelectItem value="card">Carta</SelectItem>
                <SelectItem value="bank_transfer">Bonifico</SelectItem>
                <SelectItem value="hybrid">Misto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Amount Inputs */}
          {(paymentMethod === 'cash' || paymentMethod === 'hybrid') && (
            <div>
              <Label>Importo in Contanti (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => onCashAmountChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {(paymentMethod === 'card' || paymentMethod === 'hybrid') && (
            <div>
              <Label>Importo con Carta (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={cardAmount}
                onChange={(e) => onCardAmountChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {(paymentMethod === 'bank_transfer' || paymentMethod === 'hybrid') && (
            <div>
              <Label>Importo Bonifico (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={bankTransferAmount}
                onChange={(e) => onBankTransferAmountChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}

          {/* Payment Validation */}
          {paymentMethod === 'hybrid' && (
            <Card className={`p-3 ${isBalanced ? 'bg-green-50 dark:bg-green-950/20' : 'bg-yellow-50 dark:bg-yellow-950/20'}`}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Totale Pagato:</span>
                <span className={`font-bold ${isBalanced ? 'text-green-600' : 'text-yellow-600'}`}>
                  €{totalPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-medium">Dovuto:</span>
                <span className="font-bold">€{Math.abs(calculation.net_difference).toFixed(2)}</span>
              </div>
              {!isBalanced && (
                <div className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                  ⚠️ Gli importi non corrispondono al totale dovuto
                </div>
              )}
              {isBalanced && (
                <div className="text-xs text-green-700 dark:text-green-400 mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Pagamento bilanciato correttamente
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
