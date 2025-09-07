import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  CreditCard, 
  DollarSign,
  FileText,
  Plus,
  CheckCircle,
  Package,
  RefreshCw
} from "lucide-react";
import { EnhancedProductSearch } from "./EnhancedProductSearch";
import { RefactoredSaleItemEditor } from "./RefactoredSaleItemEditor";
import { ClientSelector } from "../ClientSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { SaleNotesInput } from "./SaleNotesInput";
import { useSaleForm } from "./SaleFormProvider";

export function RefactoredStreamlinedSaleForm() {
  const {
    items,
    selectedClient,
    paymentMethod,
    notes,
    totalItems,
    subtotal,
    isLoading,
    addItem,
    setClient,
    setPaymentMethod,
    setNotes,
    refreshStock
  } = useSaleForm();

  const handleProductAdd = (product: any) => {
    addItem(product);
  };

  const handleStockRefresh = () => {
    refreshStock();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Product Selection & Items */}
      <div className="space-y-6">
        {/* Product Search */}
        <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" />
              Aggiungi Prodotti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedProductSearch
              onProductAdd={handleProductAdd}
            />
          </CardContent>
        </Card>

        {/* Sale Items */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Prodotti nella Vendita ({items.length})
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {totalItems} item{totalItems !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStockRefresh}
                  disabled={isLoading || items.length === 0}
                  className="h-8 px-3 text-xs"
                >
                  <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Aggiorna
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <RefactoredSaleItemEditor
                key={`${item.product_id}-${item.serial_number || 'no-serial'}`}
                item={item}
              />
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nessun prodotto aggiunto</p>
                <p className="text-sm">Usa la ricerca sopra per aggiungere prodotti</p>
              </div>
            )}

            {items.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotale:</span>
                    <span className="font-bold">€{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Client & Payment */}
      <div className="space-y-6">
        {/* Client Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClientSelector
              selectedClient={selectedClient}
              onClientSelect={setClient}
              onClientClear={() => setClient(null)}
            />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Metodo di Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              totalAmount={subtotal}
            />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SaleNotesInput
              value={notes}
              onChange={setNotes}
            />
          </CardContent>
        </Card>

        {/* Sale Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              Riepilogo Vendita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="font-medium">Totale Prodotti:</span>
              <span className="font-bold">{totalItems}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-medium">Subtotale:</span>
              <span className="font-bold">€{subtotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl text-primary">
              <span className="font-bold">Totale:</span>
              <span className="font-bold">€{subtotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}