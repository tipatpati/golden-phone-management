import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, User, Calendar, Package, Euro, CreditCard, FileText } from "lucide-react";
import type { ExchangeTransaction } from "@/services/sales/exchanges/types";
import { format } from "date-fns";
import { ExchangeReceiptDialog } from "./ExchangeReceiptDialog";

interface ExchangeDetailsDialogProps {
  exchange: ExchangeTransaction;
  open: boolean;
  onClose: () => void;
}

export function ExchangeDetailsDialog({ exchange, open, onClose }: ExchangeDetailsDialogProps) {
  const [showReceipt, setShowReceipt] = React.useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      excellent: 'Eccellente',
      good: 'Buono',
      fair: 'Discreto',
      poor: 'Scarso'
    };
    return labels[condition] || condition;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Contanti',
      card: 'Carta',
      bank_transfer: 'Bonifico',
      hybrid: 'Ibrido'
    };
    return labels[method] || method;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dettagli Cambio #{exchange.exchange_number}
              </DialogTitle>
              <Badge variant={getStatusColor(exchange.status)}>
                {exchange.status === 'completed' ? 'Completato' : 'Annullato'}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informazioni Generali</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(exchange.exchange_date), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cliente</p>
                    <p className="text-sm text-muted-foreground">
                      {exchange.client
                        ? exchange.client.type === 'business'
                          ? exchange.client.company_name
                          : `${exchange.client.first_name} ${exchange.client.last_name}`
                        : 'Cliente Anonimo'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Venditore</p>
                    <p className="text-sm text-muted-foreground">
                      {exchange.salesperson?.username || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Metodo Pagamento</p>
                    <p className="text-sm text-muted-foreground">
                      {getPaymentMethodLabel(exchange.payment_method)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trade-In Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Articoli in Permuta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exchange.trade_in_items && exchange.trade_in_items.length > 0 ? (
                    exchange.trade_in_items.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">{item.brand} {item.model}</p>
                            {item.serial_number && (
                              <p className="text-sm text-muted-foreground font-mono">
                                SN: {item.serial_number}
                              </p>
                            )}
                            {item.imei && (
                              <p className="text-sm text-muted-foreground font-mono">
                                IMEI: {item.imei}
                              </p>
                            )}
                            <p className="text-sm">
                              Condizione: <Badge variant="outline">{getConditionLabel(item.condition)}</Badge>
                            </p>
                            {item.assessment_notes && (
                              <p className="text-sm text-muted-foreground italic">
                                Note: {item.assessment_notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              €{item.assessed_value.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nessun articolo in permuta</p>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <p className="font-semibold">Totale Permuta</p>
                    <p className="font-bold text-green-600 text-lg">
                      €{exchange.trade_in_total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Nuovi Acquisti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exchange.new_sale?.sale_items && exchange.new_sale.sale_items.length > 0 ? (
                    exchange.new_sale.sale_items.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {item.product?.brand} {item.product?.model}
                            </p>
                            {item.serial_number && (
                              <p className="text-sm text-muted-foreground font-mono">
                                SN: {item.serial_number}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Quantità: {item.quantity} × €{item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              €{item.total_price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nessun nuovo acquisto</p>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <p className="font-semibold">Totale Acquisto</p>
                    <p className="font-bold text-primary text-lg">
                      €{exchange.purchase_total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Riepilogo Finanziario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valore Permuta</span>
                  <span className="font-semibold text-green-600">
                    €{exchange.trade_in_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valore Acquisto</span>
                  <span className="font-semibold text-primary">
                    -€{exchange.purchase_total.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Differenza Netta</span>
                  <span className={`font-bold text-xl ${
                    Math.abs(exchange.net_difference) < 0.01 
                      ? 'text-muted-foreground' 
                      : exchange.net_difference > 0 
                        ? 'text-green-600' 
                        : 'text-orange-600'
                  }`}>
                    {exchange.net_difference >= 0 ? '+' : ''}€{exchange.net_difference.toFixed(2)}
                  </span>
                </div>

                {/* Payment Breakdown */}
                {exchange.payment_method === 'hybrid' && (
                  <>
                    <Separator />
                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-medium">Dettaglio Pagamento:</p>
                      {exchange.cash_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Contanti</span>
                          <span>€{exchange.cash_amount.toFixed(2)}</span>
                        </div>
                      )}
                      {exchange.card_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Carta</span>
                          <span>€{exchange.card_amount.toFixed(2)}</span>
                        </div>
                      )}
                      {exchange.bank_transfer_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bonifico</span>
                          <span>€{exchange.bank_transfer_amount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Notes */}
                {exchange.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-1">Note:</p>
                      <p className="text-sm text-muted-foreground italic">{exchange.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button onClick={() => setShowReceipt(true)}>
                <Printer className="h-4 w-4 mr-2" />
                Stampa Ricevuta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      {showReceipt && (
        <ExchangeReceiptDialog
          exchange={exchange}
          open={showReceipt}
          onOpenChange={setShowReceipt}
        />
      )}
    </>
  );
}
