import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard } from 'lucide-react';
import { HybridPaymentManager } from '../HybridPaymentManager';
import { useSaleCreation } from '@/contexts/SaleCreationContext';

export function PaymentSection() {
  const { state, updateFormData } = useSaleCreation();
  const { formData, totalAmount } = state;

  const handlePaymentMethodChange = (method: string) => {
    const updates: any = { 
      payment_method: method,
      payment_type: method === 'hybrid' ? 'hybrid' : 'single'
    };
    
    // Reset amounts when changing payment method
    if (method !== 'hybrid') {
      updates.cash_amount = 0;
      updates.card_amount = 0;
      updates.bank_transfer_amount = 0;
    }
    
    updateFormData(updates);
  };

  const handlePaymentChange = (type: 'cash' | 'card' | 'bank_transfer', amount: number) => {
    if (type === 'cash') {
      updateFormData({ cash_amount: amount });
    } else if (type === 'card') {
      updateFormData({ card_amount: amount });
    } else if (type === 'bank_transfer') {
      updateFormData({ bank_transfer_amount: amount });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Metodo</Label>
          <Select 
            value={formData.payment_method} 
            onValueChange={handlePaymentMethodChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona metodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Contanti</SelectItem>
              <SelectItem value="card">Carta</SelectItem>
              <SelectItem value="bank_transfer">Bonifico</SelectItem>
              <SelectItem value="hybrid">Misto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hybrid Payment */}
        {formData.payment_method === 'hybrid' && (
          <HybridPaymentManager
            totalAmount={totalAmount}
            cashAmount={formData.cash_amount}
            cardAmount={formData.card_amount}
            bankTransferAmount={formData.bank_transfer_amount}
            onPaymentChange={handlePaymentChange}
          />
        )}

        {/* Single Payment Display */}
        {formData.payment_method !== 'hybrid' && totalAmount > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {formData.payment_method === 'cash' && 'Pagamento in contanti:'}
                {formData.payment_method === 'card' && 'Pagamento con carta:'}
                {formData.payment_method === 'bank_transfer' && 'Pagamento con bonifico:'}
              </span>
              <span className="font-bold text-lg">€{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}