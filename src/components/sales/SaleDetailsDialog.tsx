import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Receipt, User, CreditCard, CalendarDays, Package, DollarSign, Printer, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Sale } from '@/services/sales';
import { SaleReceiptDialog } from './SaleReceiptDialog';
import { ReceiptValidationDisplay } from './ReceiptValidationDisplay';
import { SalesDataService } from '@/services/sales/SalesDataService';

interface SaleDetailsDialogProps {
  sale: Sale;
  trigger?: React.ReactNode;
}

export function SaleDetailsDialog({ sale, trigger }: SaleDetailsDialogProps) {
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  
  // Use SalesDataService for consistent data formatting
  const statusColor = SalesDataService.getStatusColor(sale.status);
  const statusDisplay = SalesDataService.getStatusDisplay(sale.status);
  const paymentMethodDisplay = SalesDataService.getPaymentMethodDisplay(sale.payment_method);
  const clientInfo = SalesDataService.getClientInfo(sale);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-9 px-3 font-medium">
            <Eye className="h-4 w-4 mr-2" />
            Dettagli Garentille
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Dettagli Garentille - {sale.sale_number}
              </DialogTitle>
              <DialogDescription>
                Informazioni complete per la vendita #{sale.sale_number}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReceiptDialog(true)}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Stampa Ricevuta
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sale Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5" />
                Informazioni Vendita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Numero Vendita</label>
                  <p className="font-mono font-semibold">{sale.sale_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stato</label>
                  <div className="pt-1">
                    <Badge variant={statusColor} className="text-xs">
                      {statusDisplay}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Data Vendita
                  </label>
                  <p className="font-medium">
                    {format(new Date(sale.sale_date), "dd/MM/yyyy")} alle {format(new Date(sale.sale_date), "HH:mm")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Metodo di Pagamento
                  </label>
                  <p className="font-medium">
                    {paymentMethodDisplay}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Venditore
                </label>
                <p className="font-medium">{sale.salesperson?.username || "Unknown"}</p>
              </div>

              {sale.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Note</label>
                  <p className="text-sm bg-muted p-3 rounded-md">{sale.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Informazioni Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome Cliente</label>
                <p className="font-semibold">{clientInfo.name}</p>
              </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo Cliente</label>
                  <div className="pt-1">
                    <Badge variant="outline" className="text-xs">
                      {clientInfo.displayType}
                    </Badge>
                  </div>
                </div>

              {clientInfo.contact && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Persona di Contatto</label>
                  <p className="font-medium">{clientInfo.contact}</p>
                </div>
              )}

              {clientInfo.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium text-sm">{clientInfo.email}</p>
                </div>
              )}

              {clientInfo.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefono</label>
                  <p className="font-medium">{clientInfo.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sale Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Articoli Vendita ({sale.sale_items?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sale.sale_items && sale.sale_items.length > 0 ? (
              <div className="space-y-3">
                {sale.sale_items.map((item, index) => (
                  <div key={item.id || index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {item.product ? `${item.product.brand} ${item.product.model}` : "Product"}
                        {item.product?.year && ` (${item.product.year})`}
                      </p>
                      {item.serial_number && (
                        <p className="text-sm text-muted-foreground font-mono">
                          S/N: {item.serial_number}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Qtà:</span>
                        <span className="font-medium">{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Unit:</span>
                        <span className="font-medium">€{item.unit_price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Totale:</span>
                        <span className="font-bold">€{item.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nessun articolo trovato per questa vendita
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sale Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Riepilogo Vendita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotale</span>
                <span className="font-medium">€{sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Importo IVA</span>
                <span className="font-medium">€{sale.tax_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Importo Totale</span>
                <span className="font-bold text-primary">€{sale.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receipt Validation */}
        <ReceiptValidationDisplay 
          sale={sale} 
          showDetails={true}
        />
      </DialogContent>
      
      {/* Receipt Print Dialog */}
      <SaleReceiptDialog 
        sale={sale} 
        open={showReceiptDialog} 
        onOpenChange={setShowReceiptDialog} 
      />
    </Dialog>
  );
}