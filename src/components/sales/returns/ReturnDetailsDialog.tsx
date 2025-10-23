import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { SaleReturn } from "@/services/sales/returns/types";
import {
  FileText,
  User,
  Calendar,
  CreditCard,
  Package,
  AlertCircle,
  CheckCircle2,
  Euro,
  FileWarning
} from "lucide-react";

interface ReturnDetailsDialogProps {
  returnRecord: SaleReturn;
  open: boolean;
  onClose: () => void;
}

export function ReturnDetailsDialog({
  returnRecord,
  open,
  onClose
}: ReturnDetailsDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
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

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "damaged":
        return "text-orange-600";
      case "defective":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dettagli Reso #{returnRecord.return_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Badge variant={getStatusColor(returnRecord.status)} className="text-sm">
              {returnRecord.status === 'completed' ? 'Completato' : returnRecord.status === 'pending' ? 'In Attesa' : 'Annullato'}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(returnRecord.return_date), "dd/MM/yyyy 'alle' HH:mm")}
            </div>
          </div>

          <Separator />

          {/* Original Sale Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vendita Originale
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Numero Vendita</p>
                <p className="font-mono font-medium">
                  {returnRecord.sale?.sale_number ? `#${returnRecord.sale.sale_number}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">
                  {returnRecord.sale?.client ? (
                    returnRecord.sale.client.type === 'business'
                      ? returnRecord.sale.client.company_name
                      : `${returnRecord.sale.client.first_name} ${returnRecord.sale.client.last_name}`
                  ) : 'Cliente Anonimo'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Vendita</p>
                <p className="font-medium">
                  {returnRecord.sale?.sale_date
                    ? format(new Date(returnRecord.sale.sale_date), "dd/MM/yyyy")
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale Vendita</p>
                <p className="font-bold text-primary">
                  €{returnRecord.sale?.total_amount?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Return Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Informazioni Reso
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Motivo Reso</p>
                <p className="font-medium">{getReasonLabel(returnRecord.return_reason)}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Elaborato Da</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">
                    {returnRecord.returned_by_user?.username || 'Sconosciuto'}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Metodo Rimborso</p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{getRefundMethodLabel(returnRecord.refund_method)}</p>
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Importo Rimborso</p>
                <p className="font-bold text-lg text-primary">€{returnRecord.refund_amount.toFixed(2)}</p>
              </div>
            </div>

            {returnRecord.restocking_fee > 0 && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileWarning className="h-4 w-4 text-orange-600" />
                  <p className="font-medium text-orange-900 dark:text-orange-100">Costo Riassortimento</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">-€{returnRecord.restocking_fee.toFixed(2)}</p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Applicato in base alla condizione degli articoli e al tempo dalla vendita
                </p>
              </div>
            )}

            {returnRecord.notes && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Note</p>
                <p className="text-sm">{returnRecord.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Return Items */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articoli Resi ({returnRecord.return_items?.length || 0})
            </h3>
            <div className="space-y-2">
              {returnRecord.return_items?.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {item.product?.brand} {item.product?.model}
                        </p>
                        <Badge variant="outline" className={getConditionColor(item.return_condition)}>
                          {getConditionLabel(item.return_condition)}
                        </Badge>
                      </div>
                      {item.serial_number && (
                        <p className="text-xs font-mono text-muted-foreground">
                          S/N: {item.serial_number}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Quantità: <span className="font-medium text-foreground">{item.quantity}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Prezzo Unitario: <span className="font-medium text-foreground">€{item.unit_price.toFixed(2)}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rimborso</p>
                      <p className="text-lg font-bold text-primary">
                        €{item.refund_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Totale Articoli:</span>
                <span className="font-medium">
                  {returnRecord.return_items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Importo Originale:</span>
                <span className="font-medium">
                  €{(returnRecord.refund_amount + returnRecord.restocking_fee).toFixed(2)}
                </span>
              </div>
              {returnRecord.restocking_fee > 0 && (
                <div className="flex justify-between items-center text-orange-600">
                  <span>Costo Riassortimento:</span>
                  <span className="font-medium">-€{returnRecord.restocking_fee.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Rimborso Totale:</span>
                <span className="font-bold text-primary">€{returnRecord.refund_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
