import React from 'react';
import { CreditCard, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HybridPaymentManager } from '../HybridPaymentManager';
import { ClientSelector } from '../ClientSelector';
import { useSaleCreation } from '@/contexts/SaleCreationContext';

export function CleanPaymentSection() {
  const { state, updateFormData, setSelectedClient } = useSaleCreation();
  const { formData, totalAmount, selectedClient } = state;

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

  const handleClientSelect = (client: any) => {
    setSelectedClient(client);
  };

  const handleClientClear = () => {
    setSelectedClient(null);
  };

  return (
    <div className="space-y-6">
      {/* Client Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium text-on-surface">Cliente</Label>
        </div>
        <div className="p-3 bg-surface-container rounded-lg border border-border/30">
          <ClientSelector
            selectedClient={selectedClient}
            onClientSelect={handleClientSelect}
            onClientClear={handleClientClear}
          />
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium text-on-surface">Metodo di Pagamento</Label>
        </div>
        
        <div className="space-y-3">
          <Select 
            value={formData.payment_method} 
            onValueChange={handlePaymentMethodChange}
          >
            <SelectTrigger className="bg-surface-container border-border/30">
              <SelectValue placeholder="Seleziona metodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Contanti</SelectItem>
              <SelectItem value="card">Carta</SelectItem>
              <SelectItem value="bank_transfer">Bonifico</SelectItem>
              <SelectItem value="hybrid">Misto</SelectItem>
            </SelectContent>
          </Select>

          {/* Hybrid Payment Manager */}
          {formData.payment_method === 'hybrid' && (
            <div className="p-3 bg-surface-container rounded-lg border border-border/30">
              <HybridPaymentManager
                totalAmount={totalAmount}
                cashAmount={formData.cash_amount}
                cardAmount={formData.card_amount}
                bankTransferAmount={formData.bank_transfer_amount}
                onPaymentChange={handlePaymentChange}
              />
            </div>
          )}

          {/* Single Payment Display */}
          {formData.payment_method !== 'hybrid' && totalAmount > 0 && (
            <div className="p-3 bg-primary-container/20 rounded-lg border border-primary/30">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-on-surface">
                  {formData.payment_method === 'cash' && 'Pagamento in contanti'}
                  {formData.payment_method === 'card' && 'Pagamento con carta'}
                  {formData.payment_method === 'bank_transfer' && 'Pagamento con bonifico'}
                </span>
                <span className="font-bold text-lg text-primary">€{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}