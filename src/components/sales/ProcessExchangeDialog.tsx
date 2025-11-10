import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/updated-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Sale } from '@/services/sales/types';
import type { ReturnReason, ReturnCondition } from '@/services/sales/returns/types';
import { useCreateExchange } from '@/services/sales/returns/ReturnReactQueryService';
import { ReturnCalculationService } from '@/services/sales/returns/ReturnCalculationService';
import { SalesExchangeService } from '@/services/sales/returns/SalesExchangeService';
import { useProducts } from '@/hooks/useInventory';
import { Euro, Package, ArrowRight, Check, AlertCircle, RefreshCcw } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { toast } from 'sonner';

interface ProcessExchangeDialogProps {
  sale: Sale;
  open: boolean;
  onClose: () => void;
}

type Step = 'select_returns' | 'select_new_items' | 'payment' | 'confirm';

export const ProcessExchangeDialog: React.FC<ProcessExchangeDialogProps> = ({
  sale,
  open,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('select_returns');
  const [returnReason, setReturnReason] = React.useState<ReturnReason>('customer_request');
  const [notes, setNotes] = React.useState('');

  // Step 1: Return items selection
  const [selectedReturnItems, setSelectedReturnItems] = useState<Set<string>>(new Set());
  const [itemConditions, setItemConditions] = useState<Record<string, ReturnCondition>>({});

  // Step 2: New items selection
  const [selectedNewItems, setSelectedNewItems] = useState<Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    serial_number?: string;
  }>>([]);

  // Step 3: Payment details
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'hybrid'>('cash');
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [bankTransferAmount, setBankTransferAmount] = useState(0);

  const createExchange = useCreateExchange();
  const { data: allProducts = [] } = useProducts();

  const saleItems = sale.sale_items || [];

  // Calculate return credit
  const returnCalculation = useMemo(() => {
    const itemsToReturn = saleItems
      .filter(item => selectedReturnItems.has(item.id))
      .map(item => ({
        sale_item_id: item.id,
        unit_price: item.unit_price,
        quantity: item.quantity,
        return_condition: itemConditions[item.id] || 'good'
      }));

    if (itemsToReturn.length === 0) {
      return { originalAmount: 0, restockingFee: 0, refundAmount: 0, breakdown: [] };
    }

    return ReturnCalculationService.calculateReturn(sale.sale_date, itemsToReturn);
  }, [selectedReturnItems, itemConditions, saleItems, sale.sale_date]);

  // Calculate new items total
  const newItemsTotal = useMemo(() => {
    return selectedNewItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }, [selectedNewItems]);

  // Calculate exchange difference
  const exchangeCalc = useMemo(() => {
    return SalesExchangeService.calculateExchangeDifference(
      returnCalculation.refundAmount,
      newItemsTotal
    );
  }, [returnCalculation.refundAmount, newItemsTotal]);

  // Available products for exchange (filter out what's being returned)
  const availableProducts = useMemo(() => {
    return allProducts.filter(product => {
      // Filter out products with 0 stock or serialized products without available units
      if (product.has_serial) {
        // Would need to check product_units for available status
        return true; // For now, show all
      }
      return product.stock > 0;
    });
  }, [allProducts]);

  const handleReturnItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedReturnItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      const newConditions = { ...itemConditions };
      delete newConditions[itemId];
      setItemConditions(newConditions);
    } else {
      newSelected.add(itemId);
      setItemConditions({ ...itemConditions, [itemId]: 'good' });
    }
    setSelectedReturnItems(newSelected);
  };

  const handleConditionChange = (itemId: string, condition: ReturnCondition) => {
    setItemConditions({ ...itemConditions, [itemId]: condition });
  };

  const handleAddNewItem = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    setSelectedNewItems([...selectedNewItems, {
      product_id: productId,
      quantity: 1,
      unit_price: product.price || 0,
    }]);
  };

  const handleRemoveNewItem = (index: number) => {
    setSelectedNewItems(selectedNewItems.filter((_, i) => i !== index));
  };

  const handleUpdateNewItemQuantity = (index: number, quantity: number) => {
    const updated = [...selectedNewItems];
    updated[index].quantity = quantity;
    setSelectedNewItems(updated);
  };

  const handleUpdateNewItemPrice = (index: number, price: number) => {
    const updated = [...selectedNewItems];
    updated[index].unit_price = price;
    setSelectedNewItems(updated);
  };

  const handleNext = () => {
    if (currentStep === 'select_returns' && selectedReturnItems.size === 0) {
      toast.error('Seleziona almeno un articolo da restituire');
      return;
    }

    if (currentStep === 'select_new_items' && selectedNewItems.length === 0) {
      toast.error('Seleziona almeno un articolo da ricevere in cambio');
      return;
    }

    const steps: Step[] = ['select_returns', 'select_new_items', 'payment', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['select_returns', 'select_new_items', 'payment', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = () => {
    const returnItems = saleItems
      .filter(item => selectedReturnItems.has(item.id))
      .map(item => ({
        sale_item_id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        serial_number: item.serial_number,
        return_condition: itemConditions[item.id] || 'good'
      }));

    createExchange.mutate(
      {
        original_sale_id: sale.id,
        return_reason: returnReason,
        return_items: returnItems,
        new_items: selectedNewItems,
        payment_method: paymentMethod,
        cash_amount: cashAmount,
        card_amount: cardAmount,
        bank_transfer_amount: bankTransferAmount,
        notes
      },
      {
        onSuccess: () => {
          onClose();
          // Reset state
          setCurrentStep('select_returns');
          setSelectedReturnItems(new Set());
          setItemConditions({});
          setSelectedNewItems([]);
          setNotes('');
        }
      }
    );
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'select_returns', label: 'Reso', icon: Package },
      { id: 'select_new_items', label: 'Nuovi Articoli', icon: RefreshCcw },
      { id: 'payment', label: 'Pagamento', icon: Euro },
      { id: 'confirm', label: 'Conferma', icon: Check },
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isComplete = index < currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isActive ? 'bg-primary text-primary-foreground' : ''}
                  ${isComplete ? 'bg-success text-success-foreground' : ''}
                  ${!isActive && !isComplete ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${isComplete ? 'bg-success' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent size="xl" className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="h-5 w-5" />
            Elabora Cambio
          </DialogTitle>
          <DialogDescription>
            Vendita #{sale.sale_number} - {new Date(sale.sale_date).toLocaleDateString('it-IT')}
          </DialogDescription>
        </DialogHeader>

        {renderStepIndicator()}

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Step 1: Select Return Items */}
          {currentStep === 'select_returns' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Seleziona articoli da restituire</h3>
                <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
                  {saleItems.map(item => {
                    const product = item.product;
                    const isSelected = selectedReturnItems.has(item.id);

                    return (
                      <div key={item.id} className="p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleReturnItemToggle(item.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {product?.brand} {product?.model}
                              </span>
                            </div>
                            {item.serial_number && (
                              <p className="text-sm text-muted-foreground">S/N: {item.serial_number}</p>
                            )}
                            <p className="text-sm">
                              Quantità: {item.quantity} × €{item.unit_price.toFixed(2)} = €{item.total_price.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="ml-8">
                            <Label className="text-sm">Condizione di reso</Label>
                            <Select
                              value={itemConditions[item.id] || 'good'}
                              onValueChange={(value) => handleConditionChange(item.id, value as ReturnCondition)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">Nuovo (imballaggio originale)</SelectItem>
                                <SelectItem value="good">Buono (usato ma funzionante)</SelectItem>
                                <SelectItem value="damaged">Danneggiato</SelectItem>
                                <SelectItem value="defective">Difettoso (garanzia)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedReturnItems.size > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Credito da reso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Importo originale:</span>
                      <span>{formatCurrency(returnCalculation.originalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-destructive">
                      <span>Costo riassortimento:</span>
                      <span>-{formatCurrency(returnCalculation.restockingFee)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base text-success">
                      <span>Credito totale:</span>
                      <span>{formatCurrency(returnCalculation.refundAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label>Motivo del cambio</Label>
                <Select value={returnReason} onValueChange={(value) => setReturnReason(value as ReturnReason)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_request">Richiesta del cliente</SelectItem>
                    <SelectItem value="defective">Difettoso</SelectItem>
                    <SelectItem value="wrong_item">Articolo sbagliato</SelectItem>
                    <SelectItem value="changed_mind">Ripensamento</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Select New Items */}
          {currentStep === 'select_new_items' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Aggiungi articoli da ricevere</h3>

                <div className="space-y-4">
                  <Select onValueChange={handleAddNewItem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona prodotto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.brand} {product.model} - €{product.price?.toFixed(2) || '0.00'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedNewItems.length > 0 && (
                    <div className="border rounded-lg divide-y">
                      {selectedNewItems.map((item, index) => {
                        const product = availableProducts.find(p => p.id === item.product_id);
                        return (
                          <div key={index} className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium">
                                  {product?.brand} {product?.model}
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <Label className="text-xs">Quantità</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => handleUpdateNewItemQuantity(index, parseInt(e.target.value) || 1)}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Prezzo unitario</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.unit_price}
                                      onChange={(e) => handleUpdateNewItemPrice(index, parseFloat(e.target.value) || 0)}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground mt-2">
                                  Totale: {formatCurrency(item.quantity * item.unit_price)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveNewItem(index)}
                                className="ml-4"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {selectedNewItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Riepilogo cambio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between text-success">
                      <span>Credito da reso:</span>
                      <span>{formatCurrency(returnCalculation.refundAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nuovi articoli:</span>
                      <span>{formatCurrency(newItemsTotal)}</span>
                    </div>
                    <Separator />
                    {exchangeCalc.additional_payment > 0 && (
                      <div className="flex justify-between font-bold text-base text-destructive">
                        <span>Da pagare:</span>
                        <span>{formatCurrency(exchangeCalc.additional_payment)}</span>
                      </div>
                    )}
                    {exchangeCalc.refund_issued > 0 && (
                      <div className="flex justify-between font-bold text-base text-success">
                        <span>Rimborso:</span>
                        <span>{formatCurrency(exchangeCalc.refund_issued)}</span>
                      </div>
                    )}
                    {exchangeCalc.net_difference === 0 && (
                      <div className="flex justify-between font-bold text-base">
                        <span>Cambio alla pari</span>
                        <Check className="h-5 w-5 text-success" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 'payment' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Riepilogo finanziario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Credito da reso:</span>
                    <span className="text-success">{formatCurrency(returnCalculation.refundAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nuovi articoli:</span>
                    <span>{formatCurrency(newItemsTotal)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>
                      {exchangeCalc.additional_payment > 0 ? 'Da pagare:' :
                       exchangeCalc.refund_issued > 0 ? 'Rimborso:' :
                       'Cambio alla pari'}
                    </span>
                    <span className={
                      exchangeCalc.additional_payment > 0 ? 'text-destructive' :
                      exchangeCalc.refund_issued > 0 ? 'text-success' : ''
                    }>
                      {exchangeCalc.additional_payment > 0 && formatCurrency(exchangeCalc.additional_payment)}
                      {exchangeCalc.refund_issued > 0 && formatCurrency(exchangeCalc.refund_issued)}
                      {exchangeCalc.net_difference === 0 && '€0.00'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {exchangeCalc.additional_payment > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Metodo di pagamento</Label>
                    <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Contanti</SelectItem>
                        <SelectItem value="card">Carta</SelectItem>
                        <SelectItem value="bank_transfer">Bonifico bancario</SelectItem>
                        <SelectItem value="hybrid">Ibrido (Multipagamento)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === 'hybrid' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Contanti</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Carta</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Bonifico</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={bankTransferAmount}
                          onChange={(e) => setBankTransferAmount(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Note (opzionale)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note aggiuntive sul cambio..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Conferma cambio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Articoli restituiti:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {saleItems
                        .filter(item => selectedReturnItems.has(item.id))
                        .map(item => (
                          <li key={item.id}>
                            {item.product?.brand} {item.product?.model} × {item.quantity}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {itemConditions[item.id]}
                            </Badge>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Nuovi articoli:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {selectedNewItems.map((item, index) => {
                        const product = availableProducts.find(p => p.id === item.product_id);
                        return (
                          <li key={index}>
                            {product?.brand} {product?.model} × {item.quantity} - {formatCurrency(item.unit_price * item.quantity)}
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <Separator />

                  <div className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span>Credito da reso:</span>
                      <span className="text-success font-semibold">{formatCurrency(returnCalculation.refundAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Nuovi articoli:</span>
                      <span className="font-semibold">{formatCurrency(newItemsTotal)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>
                        {exchangeCalc.additional_payment > 0 ? 'Pagamento richiesto:' :
                         exchangeCalc.refund_issued > 0 ? 'Rimborso da emettere:' :
                         'Cambio alla pari'}
                      </span>
                      <span className={
                        exchangeCalc.additional_payment > 0 ? 'text-destructive' :
                        exchangeCalc.refund_issued > 0 ? 'text-success' : ''
                      }>
                        {exchangeCalc.additional_payment > 0 && formatCurrency(exchangeCalc.additional_payment)}
                        {exchangeCalc.refund_issued > 0 && formatCurrency(exchangeCalc.refund_issued)}
                        {exchangeCalc.net_difference === 0 && '€0.00'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={currentStep === 'select_returns' ? onClose : handleBack}>
            {currentStep === 'select_returns' ? 'Annulla' : 'Indietro'}
          </Button>
          <div className="flex gap-3">
            {currentStep !== 'confirm' && (
              <Button onClick={handleNext}>
                Avanti
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === 'confirm' && (
              <Button
                onClick={handleSubmit}
                disabled={createExchange.isPending}
                className="bg-primary"
              >
                {createExchange.isPending ? 'Elaborazione...' : 'Conferma Cambio'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
