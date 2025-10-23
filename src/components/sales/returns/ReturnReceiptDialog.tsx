import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { SaleReturn } from "@/services/sales/returns/types";
import { Printer, Download, CheckCircle2 } from "lucide-react";

interface ReturnReceiptDialogProps {
  returnRecord: SaleReturn;
  open: boolean;
  onClose: () => void;
}

export function ReturnReceiptDialog({
  returnRecord,
  open,
  onClose
}: ReturnReceiptDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  const getRefundMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Contanti',
      card: 'Carta',
      bank_transfer: 'Bonifico Bancario',
      store_credit: 'Credito Negozio',
      exchange: 'Scambio Prodotto'
    };
    return labels[method] || method;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      customer_request: 'Richiesta Cliente',
      defective: 'Difettoso',
      wrong_item: 'Articolo Errato',
      damaged_on_arrival: 'Danneggiato all\'Arrivo',
      changed_mind: 'Ripensamento',
      warranty_claim: 'Garanzia',
      other: 'Altro'
    };
    return labels[reason] || reason;
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      new: 'Nuovo',
      good: 'Buono',
      damaged: 'Danneggiato',
      defective: 'Difettoso'
    };
    return labels[condition] || condition;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-full">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Ricevuta Reso
          </DialogTitle>
        </DialogHeader>

        {/* Print Actions */}
        <div className="flex gap-2 print:hidden">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Stampa
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Chiudi
          </Button>
        </div>

        <Separator className="print:hidden" />

        {/* Receipt Content - Printable */}
        <div className="space-y-6 print:text-black print:bg-white">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">RICEVUTA DI RESO</h1>
            <p className="text-lg font-mono">#{returnRecord.return_number}</p>
            <p className="text-sm text-muted-foreground print:text-gray-600">
              {format(new Date(returnRecord.return_date), "dd/MM/yyyy 'alle' HH:mm")}
            </p>
          </div>

          <Separator />

          {/* Sale Information */}
          <div className="space-y-2">
            <h3 className="font-semibold">Informazioni Vendita Originale</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground print:text-gray-600">Numero Vendita:</p>
                <p className="font-medium">
                  {returnRecord.sale?.sale_number ? `#${returnRecord.sale.sale_number}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground print:text-gray-600">Data Vendita:</p>
                <p className="font-medium">
                  {returnRecord.sale?.sale_date
                    ? format(new Date(returnRecord.sale.sale_date), "dd/MM/yyyy")
                    : 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground print:text-gray-600">Cliente:</p>
                <p className="font-medium">
                  {returnRecord.sale?.client ? (
                    returnRecord.sale.client.type === 'business'
                      ? returnRecord.sale.client.company_name
                      : `${returnRecord.sale.client.first_name} ${returnRecord.sale.client.last_name}`
                  ) : 'Cliente Anonimo'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Return Information */}
          <div className="space-y-2">
            <h3 className="font-semibold">Dettagli Reso</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground print:text-gray-600">Motivo:</p>
                <p className="font-medium">{getReasonLabel(returnRecord.return_reason)}</p>
              </div>
              <div>
                <p className="text-muted-foreground print:text-gray-600">Metodo Rimborso:</p>
                <p className="font-medium">{getRefundMethodLabel(returnRecord.refund_method)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground print:text-gray-600">Elaborato Da:</p>
                <p className="font-medium">{returnRecord.returned_by_user?.username || 'Sconosciuto'}</p>
              </div>
              {returnRecord.notes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground print:text-gray-600">Note:</p>
                  <p className="font-medium">{returnRecord.notes}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <h3 className="font-semibold">Articoli Resi</h3>
            <div className="space-y-2">
              {returnRecord.return_items?.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 border rounded print:border-gray-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.product?.brand} {item.product?.model}
                      </p>
                      {item.serial_number && (
                        <p className="text-xs font-mono text-muted-foreground print:text-gray-600">
                          S/N: {item.serial_number}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground print:text-gray-600 mt-1">
                        <span>Qtà: {item.quantity}</span>
                        <span>Condizione: {getConditionLabel(item.return_condition)}</span>
                        <span>Prezzo: €{item.unit_price.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="font-bold">€{item.refund_amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground print:text-gray-600">Subtotale:</span>
              <span className="font-medium">
                €{(returnRecord.refund_amount + returnRecord.restocking_fee).toFixed(2)}
              </span>
            </div>
            {returnRecord.restocking_fee > 0 && (
              <div className="flex justify-between text-sm text-orange-600 print:text-orange-700">
                <span>Costo Riassortimento:</span>
                <span className="font-medium">-€{returnRecord.restocking_fee.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>TOTALE RIMBORSO:</span>
              <span className="text-primary print:text-black">
                €{returnRecord.refund_amount.toFixed(2)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground print:text-gray-600 space-y-1">
            <p>Grazie per la tua fiducia</p>
            <p>Conserva questa ricevuta per eventuali necessità future</p>
            <p className="font-mono pt-2">
              Documento stampato il {format(new Date(), "dd/MM/yyyy 'alle' HH:mm")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
