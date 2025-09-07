import React, { useState } from "react";
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
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { EnhancedProductSearch } from "./EnhancedProductSearch";
import { SaleItemEditor } from "./SaleItemEditor";
import { ClientSelector } from "../ClientSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { SaleNotesInput } from "./SaleNotesInput";
import { toast } from "sonner";

interface SaleItem {
  product_id: string;
  product_unit_id?: string; // ID of the specific unit being sold
  quantity: number;
  unit_price: number;
  serial_number?: string;
  barcode?: string; // Barcode of the specific unit
  brand: string;
  model: string;
  year?: number;
  stock?: number;
  min_price?: number;
  max_price?: number;
  color?: string;
  storage?: number;
  ram?: number;
}

interface StreamlinedSaleFormProps {
  saleItems: SaleItem[];
  onAddProduct: (saleItem: SaleItem) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdatePrice: (productId: string, price: number) => void;
  onRemoveItem: (productId: string) => void;
  onSerialNumberUpdate: (productId: string, serialNumber: string) => void;
  selectedClient?: any;
  onClientChange: (client: any) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  discountAmount: number;
  onDiscountAmountChange: (amount: number) => void;
  onCreateSale: () => void;
  isCreatingSale: boolean;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
}

export const StreamlinedSaleForm: React.FC<StreamlinedSaleFormProps> = ({
  saleItems,
  onAddProduct,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
  onSerialNumberUpdate,
  selectedClient,
  onClientChange,
  notes,
  onNotesChange,
  paymentMethod,
  onPaymentMethodChange,
  discountAmount,
  onDiscountAmountChange,
  onCreateSale,
  isCreatingSale,
  totals
}) => {
  const [activeStep, setActiveStep] = useState<'products' | 'details' | 'payment'>('products');

  // Validation states
  const hasProducts = saleItems.length > 0;
  const hasValidPayment = Boolean(paymentMethod);
  const hasStockIssues = saleItems.some(item => item.quantity > (item.stock || 0));

  const getStepStatus = (step: 'products' | 'details' | 'payment') => {
    switch (step) {
      case 'products':
        return hasProducts ? 'complete' : 'current';
      case 'details':
        return hasProducts && !hasValidPayment ? 'current' : hasProducts ? 'complete' : 'pending';
      case 'payment':
        return hasProducts && hasValidPayment ? 'current' : 'pending';
    }
  };

  const handleStepClick = (step: 'products' | 'details' | 'payment') => {
    if (step === 'details' && !hasProducts) {
      toast.error("Aggiungi almeno un prodotto prima di continuare");
      return;
    }
    if (step === 'payment' && (!hasProducts || !hasValidPayment)) {
      toast.error("Completa i passaggi precedenti");
      return;
    }
    setActiveStep(step);
  };

  const renderStepIndicator = (step: 'products' | 'details' | 'payment', icon: React.ReactNode, title: string) => {
    const status = getStepStatus(step);
    const isActive = activeStep === step;
    
    return (
      <Button
        variant={isActive ? "default" : status === 'complete' ? "secondary" : "outline"}
        className={`flex items-center gap-2 h-auto py-3 px-4 ${
          status === 'pending' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={() => handleStepClick(step)}
        disabled={status === 'pending'}
      >
        {status === 'complete' ? <CheckCircle className="h-4 w-4" /> : icon}
        <span className="font-medium">{title}</span>
        {status === 'complete' && (
          <Badge variant="default" className="ml-2">✓</Badge>
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {renderStepIndicator('products', <ShoppingCart className="h-4 w-4" />, 'Prodotti')}
            {renderStepIndicator('details', <FileText className="h-4 w-4" />, 'Dettagli')}
            {renderStepIndicator('payment', <CreditCard className="h-4 w-4" />, 'Pagamento')}
          </div>
          
          {hasStockIssues && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Alcuni prodotti superano la quantità disponibile
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Content */}
      {activeStep === 'products' && (
        <div className="space-y-6">
          {/* Product Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Aggiungi Prodotti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedProductSearch
                onProductAdd={onAddProduct}
              />
            </CardContent>
          </Card>

          {/* Sale Items */}
          {saleItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Prodotti nella Vendita ({saleItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {saleItems.map((item) => (
                  <SaleItemEditor
                    key={`${item.product_id}-${item.serial_number || 'no-serial'}`}
                    item={item}
                    availableStock={item.stock || 0}
                    onQuantityUpdate={onUpdateQuantity}
                    onPriceUpdate={onUpdatePrice}
                    onSerialNumberUpdate={onSerialNumberUpdate}
                    onRemoveItem={onRemoveItem}
                  />
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotale:</span>
                    <span>€{totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (22%):</span>
                    <span>€{totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                    <span>Totale:</span>
                    <span>€{totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {hasProducts && (
                  <Button 
                    onClick={() => setActiveStep('details')}
                    className="w-full"
                    size="lg"
                  >
                    Continua ai Dettagli
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeStep === 'details' && (
        <div className="space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente (Opzionale)</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientSelector
                selectedClient={selectedClient}
                onClientSelect={onClientChange}
                onClientClear={() => onClientChange(null)}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Note Aggiuntive</CardTitle>
            </CardHeader>
            <CardContent>
              <SaleNotesInput
                value={notes}
                onChange={onNotesChange}
              />
            </CardContent>
          </Card>

          <Button 
            onClick={() => setActiveStep('payment')}
            className="w-full"
            size="lg"
          >
            Continua al Pagamento
          </Button>
        </div>
      )}

      {activeStep === 'payment' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metodo di Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={onPaymentMethodChange}
                totalAmount={totals.total}
              />
            </CardContent>
          </Card>

          {/* Sale Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Riepilogo Vendita</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Prodotti:</span>
                  <span>{saleItems.length}</span>
                </div>
                {selectedClient && (
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span>
                      {selectedClient.type === 'individual' 
                        ? `${selectedClient.first_name} ${selectedClient.last_name}`
                        : selectedClient.company_name
                      }
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pagamento:</span>
                  <span className="capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Totale:</span>
                  <span>€{totals.total.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={onCreateSale}
                className="w-full"
                size="lg"
                disabled={isCreatingSale || hasStockIssues}
              >
                {isCreatingSale ? 'Creazione in corso...' : 'Completa Vendita'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};