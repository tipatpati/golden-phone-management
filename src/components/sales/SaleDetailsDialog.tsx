import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/updated-dialog';
import { Button } from '@/components/ui/updated-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { DetailsCard, DetailField } from '@/components/ui/details-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Eye, Receipt, User, CreditCard, CalendarDays, Package, Euro, Printer, CheckCircle, Clock, ChevronDown, ChevronRight, Info, Phone, Mail, MapPin, Hash, TrendingUp, FileText, ShoppingCart, Undo2, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency';
import type { Sale } from '@/services/sales';
import { SaleReceiptDialog } from './SaleReceiptDialog';
import { ReceiptValidationDisplay } from './ReceiptValidationDisplay';
import { SalesDataService } from '@/services/sales/SalesDataService';
import { ProcessReturnDialog } from './ProcessReturnDialog';
import { ProcessExchangeDialog } from './ProcessExchangeDialog';
import { useSaleReturns, useReturnEligibility } from '@/services/sales/returns/ReturnReactQueryService';

interface SaleDetailsDialogProps {
  sale: Sale;
  trigger?: React.ReactNode;
}

export function SaleDetailsDialog({ sale, trigger }: SaleDetailsDialogProps) {
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [showExchangeDialog, setShowExchangeDialog] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch returns for this sale
  const { data: saleReturns = [], isLoading: isLoadingReturns } = useSaleReturns(sale.id);
  const { data: returnEligibility } = useReturnEligibility(sale.id);

  // Use SalesDataService for consistent data formatting
  const statusColor = SalesDataService.getStatusColor(sale.status);
  const statusDisplay = SalesDataService.getStatusDisplay(sale.status);
  const paymentMethodDisplay = SalesDataService.getPaymentMethodDisplay(sale.payment_method);
  const clientInfo = SalesDataService.getClientInfo(sale);

  // Calculate financial breakdown
  const itemsCount = sale.sale_items?.length || 0;
  const avgItemPrice = itemsCount > 0 ? sale.subtotal / itemsCount : 0;
  const hasReturns = saleReturns.length > 0;

  const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-container text-success';
      case 'pending': return 'bg-warning-container text-warning';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outlined" size="sm" className="h-9 px-3 font-medium">
            <Eye className="h-4 w-4 mr-2" />
            Dettagli Garentille
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="xl" className="custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary neon-border-primary">
              <Receipt className="h-5 w-5" />
            </div>
            Dettagli Garentille - {sale.sale_number}
          </DialogTitle>
          <DialogDescription>
            Informazioni complete per la garentille #{sale.sale_number}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col px-6 sm:px-8">
          <TabsList className={cn(
            "grid w-full glass-surface",
            hasReturns ? "grid-cols-5" : "grid-cols-4"
          )}>
            <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:neon-border-primary">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2 data-[state=active]:neon-border-primary">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Articoli</span> ({itemsCount})
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-2 data-[state=active]:neon-border-primary">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Cliente</span>
            </TabsTrigger>
            {hasReturns && (
              <TabsTrigger value="returns" className="flex items-center gap-2 data-[state=active]:neon-border-primary">
                <Undo2 className="h-4 w-4" />
                <span className="hidden sm:inline">Resi</span> ({saleReturns.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="timeline" className="flex items-center gap-2 data-[state=active]:neon-border-primary">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-6">
            <TabsContent value="overview" className="space-y-6 h-full overflow-auto custom-scrollbar">
              {/* Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailsCard 
                  title="Importo Totale"
                  icon={Euro}
                  accentColor="primary"
                  delay={0}
                  variant="glass"
                >
                  <div className="text-3xl font-bold text-primary">{formatCurrency(sale.total_amount)}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {itemsCount} articol{itemsCount !== 1 ? 'i' : 'o'}
                  </p>
                </DetailsCard>

                <DetailsCard 
                  title="Stato & Pagamento"
                  icon={CreditCard}
                  accentColor={getStatusType(sale.status) === 'success' ? 'success' : getStatusType(sale.status) === 'warning' ? 'warning' : 'destructive'}
                  delay={1}
                  variant="glass"
                >
                  <StatusBadge status={getStatusType(sale.status)} className="text-sm">
                    {statusDisplay}
                  </StatusBadge>
                  <p className="text-sm text-muted-foreground mt-2">
                    {paymentMethodDisplay}
                  </p>
                </DetailsCard>

                <DetailsCard 
                  title="Prezzo Medio"
                  icon={TrendingUp}
                  accentColor="success"
                  delay={2}
                  variant="glass"
                >
                  <div className="text-2xl font-semibold">{formatCurrency(avgItemPrice)}</div>
                  <p className="text-sm text-muted-foreground mt-1">per articolo</p>
                </DetailsCard>
              </div>

              {/* Sale Information */}
              <DetailsCard 
                title="Informazioni Garentille"
                icon={Hash}
                delay={3}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DetailField
                    label="Numero Garentille"
                    value={<span className="font-mono">{sale.sale_number}</span>}
                    copyable
                  />
                  <DetailField
                    label="Data Garentille"
                    value={format(new Date(sale.sale_date), "EEEE, dd MMMM yyyy 'alle' HH:mm")}
                    icon={CalendarDays}
                  />
                  <DetailField
                    label="Venditore"
                    value={sale.salesperson?.username || "Unknown"}
                    icon={User}
                  />
                  <DetailField
                    label="Metodo di Pagamento"
                    value={
                      <StatusBadge status="default">
                        {paymentMethodDisplay}
                      </StatusBadge>
                    }
                    icon={CreditCard}
                  />
                </div>

                {sale.notes && (
                  <div className="mt-6">
                    <label className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">Note</label>
                    <div className="glass-card bg-surface-container/40 p-4 mt-2">
                      <p className="text-sm leading-relaxed">{sale.notes}</p>
                    </div>
                  </div>
                )}
              </DetailsCard>

              {/* Financial Summary */}
              <DetailsCard 
                title="Riepilogo Finanziario"
                icon={Euro}
                accentColor="success"
                delay={4}
                variant="glass"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-muted-foreground">Subtotale</span>
                    <span className="font-medium">{formatCurrency(sale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm sm:text-base">
                    <span className="text-muted-foreground">Importo IVA</span>
                    <span className="font-medium">{formatCurrency(sale.tax_amount)}</span>
                  </div>
                  {sale.discount_amount > 0 && (
                    <div className="flex justify-between items-center text-sm sm:text-base">
                      <span className="text-muted-foreground">Sconto</span>
                      <span className="font-medium text-success">-{formatCurrency(sale.discount_amount)}</span>
                    </div>
                  )}
                  <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent my-2" />
                  <div className="flex justify-between items-center text-lg sm:text-xl pt-2">
                    <span className="font-semibold">Importo Totale</span>
                    <span className="font-bold text-primary text-2xl sm:text-3xl">{formatCurrency(sale.total_amount)}</span>
                  </div>
                </div>
              </DetailsCard>

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
                          <label className="font-medium text-muted-foreground">ID Garentille</label>
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

            <TabsContent value="items" className="h-full overflow-auto custom-scrollbar">
              <DetailsCard 
                title="Articoli Garentille"
                icon={ShoppingCart}
                delay={0}
              >
                <p className="text-sm text-muted-foreground mb-4">
                  {itemsCount} articol{itemsCount !== 1 ? "i" : "o"} in questa garentille
                </p>
                
                {sale.sale_items && sale.sale_items.length > 0 ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {sale.sale_items.map((item, index) => (
                        <div 
                          key={item.id || index} 
                          className="glass-card neon-border-left p-4 stagger-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base sm:text-lg mb-3">
                                {item.product ? `${item.product.brand} ${item.product.model}` : "Prodotto"}
                                {item.product?.year && ` (${item.product.year})`}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <DetailField
                                  label="Quantità"
                                  value={item.quantity}
                                />
                                <DetailField
                                  label="Prezzo Unitario"
                                  value={formatCurrency(item.unit_price)}
                                />
                                <DetailField
                                  label="Prezzo Totale"
                                  value={<span className="text-primary font-semibold">{formatCurrency(item.total_price)}</span>}
                                />
                                {item.serial_number && (
                                  <div className="col-span-1 sm:col-span-2">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">IMEI / Serial</label>
                                    <div className="glass-card bg-surface-container/60 font-mono text-xs px-3 py-2 mt-1">
                                      {item.serial_number}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Nessun articolo trovato per questa garentille</p>
                  </div>
                )}
              </DetailsCard>
            </TabsContent>

            <TabsContent value="client" className="h-full overflow-auto custom-scrollbar">
              <DetailsCard 
                title="Informazioni Cliente"
                icon={User}
                accentColor="primary"
                delay={0}
              >
                <p className="text-sm text-muted-foreground mb-6">
                  Dettagli completi del cliente per questa garentille
                </p>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DetailField
                      label="Nome Cliente"
                      value={<span className="text-lg">{clientInfo.name}</span>}
                    />
                    <DetailField
                      label="Tipo Cliente"
                      value={
                        <StatusBadge status="default">
                          {clientInfo.displayType}
                        </StatusBadge>
                      }
                    />
                  </div>

                  {clientInfo.contact && (
                    <DetailField
                      label="Persona di Contatto"
                      value={clientInfo.contact}
                      icon={User}
                    />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clientInfo.email && (
                      <DetailField
                        label="Email"
                        value={clientInfo.email}
                        icon={Mail}
                        copyable
                      />
                    )}

                    {clientInfo.phone && (
                      <DetailField
                        label="Telefono"
                        value={clientInfo.phone}
                        icon={Phone}
                        copyable
                      />
                    )}
                  </div>
                </div>
              </DetailsCard>
            </TabsContent>

            {/* Returns Tab */}
            {hasReturns && (
              <TabsContent value="returns" className="h-full overflow-auto custom-scrollbar">
                <DetailsCard
                  title="Resi per questa vendita"
                  icon={Undo2}
                  accentColor="warning"
                  delay={0}
                >
                  <p className="text-sm text-muted-foreground mb-6">
                    Cronologia dei resi per questa garentille
                  </p>

                  {isLoadingReturns ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
                      <p>Caricamento resi...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {saleReturns.map((returnRecord: any, index: number) => (
                        <div
                          key={returnRecord.id}
                          className="glass-card neon-border-left p-4 stagger-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-base flex items-center gap-2">
                                #{returnRecord.return_number}
                                <StatusBadge
                                  status={
                                    returnRecord.status === 'completed' ? 'success' :
                                    returnRecord.status === 'cancelled' ? 'error' :
                                    'warning'
                                  }
                                  className="text-xs"
                                >
                                  {returnRecord.status}
                                </StatusBadge>
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(returnRecord.return_date), "dd MMM yyyy 'alle' HH:mm")}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-success">
                                {formatCurrency(returnRecord.refund_amount)}
                              </div>
                              {returnRecord.restocking_fee > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Costo riassortimento: -{formatCurrency(returnRecord.restocking_fee)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                            <DetailField
                              label="Motivo"
                              value={returnRecord.return_reason}
                            />
                            <DetailField
                              label="Metodo rimborso"
                              value={
                                <div className="flex items-center gap-2">
                                  {returnRecord.refund_method}
                                  {returnRecord.refund_method === 'exchange' && (
                                    <Badge variant="outline" className="text-xs">
                                      <RefreshCcw className="h-3 w-3 mr-1" />
                                      Cambio
                                    </Badge>
                                  )}
                                </div>
                              }
                            />
                            <DetailField
                              label="Elaborato da"
                              value={returnRecord.returned_by_user?.username || 'Unknown'}
                              icon={User}
                            />
                          </div>

                          {returnRecord.return_items && returnRecord.return_items.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                                Articoli restituiti
                              </label>
                              <div className="space-y-2">
                                {returnRecord.return_items.map((item: any) => (
                                  <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span>
                                      {item.product?.brand} {item.product?.model}
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {item.return_condition}
                                      </Badge>
                                    </span>
                                    <span className="font-medium">
                                      {item.quantity}× - {formatCurrency(item.refund_amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {returnRecord.notes && (
                            <div className="mt-3 pt-3 border-t">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Note</label>
                              <p className="text-sm mt-1">{returnRecord.notes}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </DetailsCard>
              </TabsContent>
            )}

            <TabsContent value="timeline" className="h-full overflow-auto custom-scrollbar">
              <DetailsCard 
                title="Timeline Garentille"
                icon={Clock}
                accentColor="primary"
                delay={0}
              >
                <p className="text-sm text-muted-foreground mb-6">
                  Cronologia degli eventi per questa garentille
                </p>
                
                <div className="relative border-l-2 border-primary/20 pl-6 space-y-6">
                  {/* Created Event */}
                  <div className="relative stagger-fade-in" style={{ animationDelay: '0ms' }}>
                    <div className="absolute -left-[1.6rem] w-4 h-4 bg-primary rounded-full ring-4 ring-background shadow-[0_0_10px_hsl(var(--primary)/0.5)]"></div>
                    <div className="glass-card bg-surface-container/40 p-4">
                      <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Garentille Creata
                      </h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        {format(new Date(sale.created_at || sale.sale_date), "EEEE, dd MMMM yyyy 'alle' HH:mm:ss")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(sale.created_at || sale.sale_date))} fa
                      </p>
                    </div>
                  </div>

                  {/* Updated Event */}
                  {sale.updated_at && sale.updated_at !== (sale.created_at || sale.sale_date) && (
                    <div className="relative stagger-fade-in" style={{ animationDelay: '100ms' }}>
                      <div className="absolute -left-[1.6rem] w-4 h-4 bg-muted-foreground rounded-full ring-4 ring-background"></div>
                      <div className="glass-card bg-surface-container/40 p-4">
                        <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Ultimo Aggiornamento
                        </h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          {format(new Date(sale.updated_at), "EEEE, dd MMMM yyyy 'alle' HH:mm:ss")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(sale.updated_at))} fa
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Current Status */}
                  <div className="relative stagger-fade-in" style={{ animationDelay: '200ms' }}>
                    <div className={cn(
                      "absolute -left-[1.6rem] w-4 h-4 rounded-full ring-4 ring-background",
                      getStatusType(sale.status) === 'success' && "bg-success shadow-[0_0_10px_hsl(var(--success)/0.5)]",
                      getStatusType(sale.status) === 'warning' && "bg-warning shadow-[0_0_10px_hsl(var(--warning)/0.5)]",
                      getStatusType(sale.status) === 'error' && "bg-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.5)]",
                      getStatusType(sale.status) === 'default' && "bg-muted-foreground"
                    )}></div>
                    <div className="glass-card bg-surface-container/40 p-4">
                      <h4 className="font-semibold text-base mb-2">Stato Attuale</h4>
                      <StatusBadge status={getStatusType(sale.status)} className="text-sm">
                        {statusDisplay}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
              </DetailsCard>
            </TabsContent>
          </div>
        </Tabs>

         {/* Receipt Validation */}
        <div className="px-6 sm:px-8 pb-6">
          <ReceiptValidationDisplay 
            sale={sale} 
            showDetails={true}
          />
        </div>

        <DialogFooter>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Creata {formatDistanceToNow(new Date(sale.created_at || sale.sale_date))} fa
              </div>
              {returnEligibility && (
                <div className="flex items-center gap-2 text-xs">
                  {returnEligibility.eligible ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span className="text-success">
                        Reso disponibile
                        {returnEligibility.restocking_fee_applicable &&
                          ` (${returnEligibility.days_since_sale} giorni, costo riassortimento applicato)`
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      <span className="text-warning">{returnEligibility.reason}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              {sale.status !== 'refunded' && sale.status !== 'cancelled' && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => setShowReturnDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Undo2 className="h-4 w-4" />
                    Elabora Reso
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowExchangeDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Elabora Cambio
                  </Button>
                </>
              )}
              <Button
                variant="outlined"
                onClick={() => setShowReceiptDialog(true)}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Stampa Ricevuta
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
      
      {/* Receipt Print Dialog */}
      <SaleReceiptDialog 
        sale={sale} 
        open={showReceiptDialog} 
        onOpenChange={setShowReceiptDialog} 
      />
      
      {/* Process Return Dialog */}
      <ProcessReturnDialog
        sale={sale}
        open={showReturnDialog}
        onClose={() => setShowReturnDialog(false)}
      />

      {/* Process Exchange Dialog */}
      <ProcessExchangeDialog
        sale={sale}
        open={showExchangeDialog}
        onClose={() => setShowExchangeDialog(false)}
      />
    </Dialog>
  );
}