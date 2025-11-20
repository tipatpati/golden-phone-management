import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/updated-dialog';
import { Button } from '@/components/ui/updated-button';
import { ArrowLeftRight, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SalesPermissionGuard } from './SalesPermissionGuard';
import { ExchangeWizardSteps } from './exchanges/ExchangeWizardSteps';
import { ExchangeStepClient } from './exchanges/ExchangeStepClient';
import { ExchangeStepTradeIn } from './exchanges/ExchangeStepTradeIn';
import { ExchangeStepPurchase } from './exchanges/ExchangeStepPurchase';
import { ExchangeStepPayment } from './exchanges/ExchangeStepPayment';
import { ExchangeStepReview } from './exchanges/ExchangeStepReview';
import { useCreateExchange } from '@/services/sales/exchanges/ExchangeReactQueryService';
import { ExchangeTransactionService } from '@/services/sales/exchanges/ExchangeTransactionService';
import type { TradeInItem, NewPurchaseItem } from '@/services/sales/exchanges/types';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentStoreId } from '@/services/stores/storeHelpers';

type ExchangeStep = 'client' | 'trade_in' | 'purchase' | 'payment' | 'review';

export function NewExchangeDialog() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<ExchangeStep>('client');
  const { user } = useAuth();
  const createExchange = useCreateExchange();

  // Exchange data state
  const [clientId, setClientId] = useState<string | undefined>();
  const [tradeInItems, setTradeInItems] = useState<TradeInItem[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<NewPurchaseItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'hybrid'>('cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [bankTransferAmount, setBankTransferAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [assessmentNotes, setAssessmentNotes] = useState('');

  // Calculate totals
  const tradeInTotal = tradeInItems.reduce((sum, item) => sum + item.assessed_value, 0);
  const purchaseTotal = purchaseItems.reduce((sum, item) => sum + item.total_price, 0);
  const calculation = ExchangeTransactionService.calculateExchange(tradeInTotal, purchaseTotal);

  const steps: ExchangeStep[] = ['client', 'trade_in', 'purchase', 'payment', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'client':
        return true; // Client is optional
      case 'trade_in':
        return tradeInItems.length > 0;
      case 'purchase':
        return purchaseItems.length > 0;
      case 'payment':
        if (calculation.even_exchange) return true;
        if (calculation.client_pays) {
          const totalPaid = cashAmount + cardAmount + bankTransferAmount;
          return Math.abs(totalPaid - calculation.net_difference) < 0.01;
        }
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      return;
    }

    const storeId = await getCurrentStoreId();
    if (!storeId) {
      return;
    }

    try {
      await createExchange.mutateAsync({
        store_id: storeId,
        client_id: clientId,
        salesperson_id: user.id,
        trade_in_items: tradeInItems,
        new_items: purchaseItems,
        trade_in_total: tradeInTotal,
        purchase_total: purchaseTotal,
        net_difference: calculation.net_difference,
        payment_method: paymentMethod,
        cash_amount: cashAmount,
        card_amount: cardAmount,
        bank_transfer_amount: bankTransferAmount,
        notes,
        trade_in_assessment_notes: assessmentNotes,
      });

      // Reset and close
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating exchange:', error);
    }
  };

  const resetForm = () => {
    setCurrentStep('client');
    setClientId(undefined);
    setTradeInItems([]);
    setPurchaseItems([]);
    setPaymentMethod('cash');
    setCashAmount(0);
    setCardAmount(0);
    setBankTransferAmount(0);
    setNotes('');
    setAssessmentNotes('');
  };

  return (
    <SalesPermissionGuard requiredRole="create">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full lg:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg font-bold py-6 px-8 min-h-[60px]">
            <ArrowLeftRight className="mr-3 h-7 w-7" />
            NUOVO CAMBIO
          </Button>
        </DialogTrigger>
        
        <DialogContent size="xl" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Nuovo Cambio</DialogTitle>
          </DialogHeader>

          <ExchangeWizardSteps currentStep={currentStep} />

          <div className="mt-6">
            {currentStep === 'client' && (
              <ExchangeStepClient
                clientId={clientId}
                onClientChange={setClientId}
              />
            )}
            
            {currentStep === 'trade_in' && (
              <ExchangeStepTradeIn
                items={tradeInItems}
                onItemsChange={setTradeInItems}
                assessmentNotes={assessmentNotes}
                onAssessmentNotesChange={setAssessmentNotes}
              />
            )}
            
            {currentStep === 'purchase' && (
              <ExchangeStepPurchase
                items={purchaseItems}
                onItemsChange={setPurchaseItems}
              />
            )}
            
            {currentStep === 'payment' && (
              <ExchangeStepPayment
                calculation={calculation}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                cashAmount={cashAmount}
                onCashAmountChange={setCashAmount}
                cardAmount={cardAmount}
                onCardAmountChange={setCardAmount}
                bankTransferAmount={bankTransferAmount}
                onBankTransferAmountChange={setBankTransferAmount}
              />
            )}
            
            {currentStep === 'review' && (
              <ExchangeStepReview
                clientId={clientId}
                tradeInItems={tradeInItems}
                purchaseItems={purchaseItems}
                calculation={calculation}
                paymentMethod={paymentMethod}
                cashAmount={cashAmount}
                cardAmount={cardAmount}
                bankTransferAmount={bankTransferAmount}
                notes={notes}
                onNotesChange={setNotes}
              />
            )}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Indietro
            </Button>

            {currentStepIndex < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
              >
                Avanti
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceedToNext() || createExchange.isPending}
                className="bg-gradient-to-r from-green-500 to-green-600"
              >
                <Check className="mr-2 h-4 w-4" />
                {createExchange.isPending ? 'Creazione...' : 'Conferma Cambio'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SalesPermissionGuard>
  );
}
