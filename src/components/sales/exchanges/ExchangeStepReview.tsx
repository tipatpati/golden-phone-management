import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ExchangeTransactionService } from '@/services/sales/exchanges/ExchangeTransactionService';
import type { TradeInItem, NewPurchaseItem, ExchangeCalculation } from '@/services/sales/exchanges/types';
import { useClients } from '@/services';

interface ExchangeStepReviewProps {
  clientId?: string;
  tradeInItems: TradeInItem[];
  purchaseItems: NewPurchaseItem[];
  calculation: ExchangeCalculation;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'hybrid';
  cashAmount: number;
  cardAmount: number;
  bankTransferAmount: number;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function ExchangeStepReview({
  clientId,
  tradeInItems,
  purchaseItems,
  calculation,
  paymentMethod,
  cashAmount,
  cardAmount,
  bankTransferAmount,
  notes,
  onNotesChange,
}: ExchangeStepReviewProps) {
  const { data: clients } = useClients();
  const client = clients?.find((c) => c.id === clientId);

  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      cash: 'Contanti',
      card: 'Carta',
      bank_transfer: 'Bonifico',
      hybrid: 'Misto',
    };
    return labels[method] || method;
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Conferma Cambio</h3>
        <p className="text-sm text-muted-foreground">
          Rivedi tutti i dettagli prima di confermare il cambio.
        </p>
      </div>

      {/* Client Info */}
      {client && (
        <Card className="p-4">
          <h4 className="font-semibold mb-2">Cliente</h4>
          <div className="text-sm">
            {client.type === 'individual'
              ? `${client.first_name} ${client.last_name}`
              : client.company_name}
          </div>
          {client.phone && <div className="text-sm text-muted-foreground">{client.phone}</div>}
        </Card>
      )}

      {/* Trade-In Items */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Articoli in Permuta</h4>
        <div className="space-y-2">
          {tradeInItems.map((item, index) => (
            <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
              <div className="flex-1">
                <div className="font-medium">{item.brand} {item.model}</div>
                <div className="text-sm text-muted-foreground">
                  {ExchangeTransactionService.getConditionLabel(item.condition)}
                </div>
                {item.serial_number && (
                  <div className="text-xs text-muted-foreground">S/N: {item.serial_number}</div>
                )}
              </div>
              <div className="text-right font-semibold text-green-600">
                €{item.assessed_value.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between font-bold">
          <span>Totale Permuta:</span>
          <span className="text-green-600">€{calculation.trade_in_total.toFixed(2)}</span>
        </div>
      </Card>

      {/* Purchase Items */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Articoli da Acquistare</h4>
        <div className="space-y-2">
          {purchaseItems.map((item, index) => (
            <div key={index} className="flex justify-between items-start py-2 border-b last:border-0">
              <div className="flex-1">
                <div className="font-medium">Prodotto #{index + 1}</div>
                <div className="text-sm text-muted-foreground">
                  Quantità: {item.quantity} × €{item.unit_price.toFixed(2)}
                </div>
                {item.serial_number && (
                  <div className="text-xs text-muted-foreground">S/N: {item.serial_number}</div>
                )}
              </div>
              <div className="text-right font-semibold text-blue-600">
                €{item.total_price.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between font-bold">
          <span>Totale Acquisto:</span>
          <span className="text-blue-600">€{calculation.purchase_total.toFixed(2)}</span>
        </div>
      </Card>

      {/* Financial Summary */}
      <Card className="p-4 bg-purple-50 dark:bg-purple-950/20">
        <h4 className="font-semibold mb-3">Riepilogo Finanziario</h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Valore Permuta:</span>
            <span className="font-semibold text-green-600">€{calculation.trade_in_total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Totale Acquisto:</span>
            <span className="font-semibold text-blue-600">€{calculation.purchase_total.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Differenza:</span>
            <span className={calculation.client_pays ? 'text-red-600' : calculation.client_receives ? 'text-green-600' : 'text-foreground'}>
              {calculation.even_exchange
                ? 'Cambio alla Pari'
                : `€${Math.abs(calculation.net_difference).toFixed(2)}`}
            </span>
          </div>
          {calculation.client_pays && (
            <div className="text-sm text-red-600">Il cliente paga</div>
          )}
          {calculation.client_receives && (
            <div className="text-sm text-green-600">Il cliente riceve</div>
          )}
        </div>

        {!calculation.even_exchange && calculation.client_pays && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1">
              <div className="font-semibold mb-2">Pagamento:</div>
              <div className="text-sm">{getPaymentMethodLabel(paymentMethod)}</div>
              {paymentMethod === 'hybrid' && (
                <div className="text-sm space-y-1 mt-2">
                  {cashAmount > 0 && <div>Contanti: €{cashAmount.toFixed(2)}</div>}
                  {cardAmount > 0 && <div>Carta: €{cardAmount.toFixed(2)}</div>}
                  {bankTransferAmount > 0 && <div>Bonifico: €{bankTransferAmount.toFixed(2)}</div>}
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Notes */}
      <div>
        <Label>Note Aggiuntive (Opzionale)</Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Aggiungi eventuali note sul cambio..."
          rows={3}
        />
      </div>
    </div>
  );
}
