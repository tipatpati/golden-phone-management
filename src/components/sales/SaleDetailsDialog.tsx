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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Eye, Receipt, User, CreditCard, CalendarDays, Package, Euro, Printer, CheckCircle, AlertCircle, Clock, ChevronDown, ChevronRight, Info, Phone, Mail, MapPin, Hash, TrendingUp, FileText, ShoppingCart } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency';
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Use SalesDataService for consistent data formatting
  const statusColor = SalesDataService.getStatusColor(sale.status);
  const statusDisplay = SalesDataService.getStatusDisplay(sale.status);
  const paymentMethodDisplay = SalesDataService.getPaymentMethodDisplay(sale.payment_method);
  const clientInfo = SalesDataService.getClientInfo(sale);

  // Calculate financial breakdown
  const itemsCount = sale.sale_items?.length || 0;
  const avgItemPrice = itemsCount > 0 ? sale.subtotal / itemsCount : 0;

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Dettagli Garentille - {sale.sale_number}
              </DialogTitle>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articoli ({itemsCount})
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="space-y-6 h-full overflow-auto">
              {/* Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Importo Totale
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(sale.total_amount)}</div>
                    <p className="text-xs text-muted-foreground">
                      {itemsCount} articol{itemsCount !== 1 ? 'i' : 'o'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Stato & Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={cn("text-sm", getStatusColorClass(sale.status))}>
                      {statusDisplay}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentMethodDisplay}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Prezzo Medio Articolo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-semibold">{formatCurrency(avgItemPrice)}</div>
                    <p className="text-xs text-muted-foreground">per articolo</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sale Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Informazioni Vendita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Numero Vendita</label>
                      <p className="font-mono text-sm">{sale.sale_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data Vendita</label>
                      <p className="text-sm">{format(new Date(sale.sale_date), "EEEE, dd MMMM yyyy 'alle' HH:mm")}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Venditore</label>
                      <p className="text-sm">{sale.salesperson?.username || "Unknown"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Metodo di Pagamento</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {paymentMethodDisplay}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {sale.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Note</label>
                      <div className="bg-muted/30 rounded-md p-3 mt-1">
                        <p className="text-sm">{sale.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Riepilogo Finanziario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotale</span>
                      <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Importo IVA</span>
                      <span className="font-medium">{formatCurrency(sale.tax_amount)}</span>
                    </div>
                    {sale.discount_amount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Sconto</span>
                        <span className="font-medium text-green-600">-{formatCurrency(sale.discount_amount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Importo Totale</span>
                      <span className="font-bold text-primary">{formatCurrency(sale.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Details Collapsible */}
              <Collapsible open={showTechnicalDetails} onOpenChange={setShowTechnicalDetails}>
                <CollapsibleTrigger asChild>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Dettagli Tecnici
                        </div>
                        {showTechnicalDetails ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-muted-foreground">ID Vendita</label>
                          <p className="font-mono text-xs break-all">{sale.id}</p>
                        </div>
                        {sale.client_id && (
                          <div>
                            <label className="font-medium text-muted-foreground">ID Cliente</label>
                            <p className="font-mono text-xs break-all">{sale.client_id}</p>
                          </div>
                        )}
                        <div>
                          <label className="font-medium text-muted-foreground">Creata il</label>
                          <p className="text-xs">{format(new Date(sale.created_at || sale.sale_date), "dd MMM yyyy HH:mm:ss")}</p>
                        </div>
                        {sale.updated_at && (
                          <div>
                            <label className="font-medium text-muted-foreground">Ultimo Aggiornamento</label>
                            <p className="text-xs">{format(new Date(sale.updated_at), "dd MMM yyyy HH:mm:ss")}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="items" className="h-full overflow-auto">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Articoli Vendita
                  </CardTitle>
                  <CardDescription>
                    {itemsCount} articol{itemsCount !== 1 ? 'i' : 'o'} in questa vendita
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sale.sale_items && sale.sale_items.length > 0 ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {sale.sale_items.map((item, index) => (
                          <Card key={item.id || index} className="border-l-4 border-l-primary/20">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    {item.product ? `${item.product.brand} ${item.product.model}` : "Prodotto"}
                                    {item.product?.year && ` (${item.product.year})`}
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                                    <div>
                                      <span className="font-medium">Quantità:</span> {item.quantity}
                                    </div>
                                    <div>
                                      <span className="font-medium">Prezzo Unitario:</span> {formatCurrency(item.unit_price)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Prezzo Totale:</span> {formatCurrency(item.total_price)}
                                    </div>
                                    {item.serial_number && (
                                      <div className="col-span-2">
                                        <span className="font-medium text-muted-foreground">IMEI:</span>
                                        <div className="text-xs font-mono bg-background border rounded px-2 py-1 mt-1">
                                          {item.serial_number}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessun articolo trovato per questa vendita
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client" className="h-full overflow-auto">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informazioni Cliente
                  </CardTitle>
                  <CardDescription>
                    Dettagli completi del cliente per questa vendita
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nome Cliente</label>
                      <p className="font-semibold text-lg">{clientInfo.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo Cliente</label>
                      <div className="pt-1">
                        <Badge variant="outline" className="text-sm">
                          {clientInfo.displayType}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {clientInfo.contact && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Persona di Contatto
                      </label>
                      <p className="font-medium">{clientInfo.contact}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clientInfo.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          Email
                        </label>
                        <p className="font-medium text-sm">{clientInfo.email}</p>
                      </div>
                    )}

                    {clientInfo.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Telefono
                        </label>
                        <p className="font-medium">{clientInfo.phone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="h-full overflow-auto">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timeline Vendita
                  </CardTitle>
                  <CardDescription>
                    Cronologia degli eventi per questa vendita
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-l-2 border-muted-foreground/20 pl-4 space-y-4">
                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 bg-primary rounded-full"></div>
                      <div>
                        <h4 className="font-medium">Vendita Creata</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(sale.created_at || sale.sale_date), "EEEE, dd MMMM yyyy 'alle' HH:mm:ss")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(sale.created_at || sale.sale_date))} fa
                        </p>
                      </div>
                    </div>

                    {sale.updated_at && sale.updated_at !== (sale.created_at || sale.sale_date) && (
                      <div className="relative">
                        <div className="absolute -left-6 w-3 h-3 bg-muted-foreground rounded-full"></div>
                        <div>
                          <h4 className="font-medium">Ultimo Aggiornamento</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(sale.updated_at), "EEEE, dd MMMM yyyy 'alle' HH:mm:ss")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(sale.updated_at))} fa
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <div className="absolute -left-6 w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium">Stato Attuale</h4>
                        <Badge className={cn("text-sm mt-1", getStatusColorClass(sale.status))}>
                          {statusDisplay}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Receipt Validation */}
        <div className="mt-6">
          <ReceiptValidationDisplay 
            sale={sale} 
            showDetails={true}
          />
        </div>
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