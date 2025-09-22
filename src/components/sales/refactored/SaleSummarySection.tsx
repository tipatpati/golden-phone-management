import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Euro, 
  Percent, 
  FileText, 
  User,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ClientSelector } from '../ClientSelector';
import { VATModeSelector } from '../VATModeSelector';
import { VATDebugPanel } from '../VATDebugPanel';
import { useSaleCreation } from '@/contexts/SaleCreationContext';
import { useCreateSale } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SaleSummarySectionProps {
  onSaleComplete?: (sale: any) => void;
  onCancel?: () => void;
}

export function SaleSummarySection({ onSaleComplete, onCancel }: SaleSummarySectionProps) {
  const { state, updateFormData, validateSale, resetSale } = useSaleCreation();
  const { user } = useAuth();
  const { toast } = useToast();
  const createSale = useCreateSale();

  const { 
    items, 
    formData, 
    subtotal, 
    discountAmount, 
    taxAmount, 
    totalAmount, 
    isValid, 
    validationErrors 
  } = state;

  const handleDiscountTypeChange = (type: 'percentage' | 'amount') => {
    const newType = formData.discount_type === type ? null : type;
    updateFormData({ 
      discount_type: newType,
      discount_value: newType ? formData.discount_value : 0
    });
  };

  const handleDiscountValueChange = (value: number) => {
    updateFormData({ discount_value: value });
  };

  const handleNotesChange = (notes: string) => {
    updateFormData({ notes });
  };

  const handleClientSelect = (client: any) => {
    updateFormData({ client_id: client?.id });
  };

  const handleVATModeChange = (vatIncluded: boolean) => {
    console.log('🔄 SaleSummarySection - handleVATModeChange:', vatIncluded);
    updateFormData({ vat_included: vatIncluded });
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ 
        title: 'Errore', 
        description: 'Utente non autenticato', 
        variant: 'destructive' 
      });
      return;
    }

    // Validate before submit
    const isValidSale = await validateSale();
    if (!isValidSale) {
      toast({ 
        title: 'Validazione fallita', 
        description: validationErrors.join(', '), 
        variant: 'destructive' 
      });
      return;
    }

    try {
      // Debug VAT state at submission time
      console.log('🚀 CREATING SALE WITH VAT STATE (SaleSummarySection):', {
        formData_vat_included: formData.vat_included,
        context_state_vat: state.formData.vat_included,
        subtotal,
        taxAmount,
        totalAmount
      });
      
      const saleData = {
        client_id: formData.client_id,
        salesperson_id: user.id,
        payment_method: formData.payment_method,
        payment_type: formData.payment_type || 'single',
        cash_amount: formData.payment_method === 'hybrid' ? formData.cash_amount : 
                    (formData.payment_method === 'cash' ? totalAmount : 0),
        card_amount: formData.payment_method === 'hybrid' ? formData.card_amount : 
                    (formData.payment_method === 'card' ? totalAmount : 0),
        bank_transfer_amount: formData.payment_method === 'hybrid' ? formData.bank_transfer_amount : 
                             (formData.payment_method === 'bank_transfer' ? totalAmount : 0),
        discount_amount: discountAmount,
        discount_percentage: formData.discount_type === 'percentage' ? formData.discount_value : 0,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        vat_included: formData.vat_included,
        notes: formData.notes,
        sale_items: items.map(item => ({
          product_id: item.product_id,
          product_unit_id: item.product_unit_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          serial_number: item.serial_number,
          barcode: item.barcode
        }))
      };

      console.log('📤 FINAL SALE DATA BEING SENT (SaleSummarySection):', saleData);

      const result = await createSale.mutateAsync(saleData as any);
      toast({ title: 'Successo', description: 'Vendita creata con successo!' });
      resetSale();
      onSaleComplete?.(result);
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({ 
        title: 'Errore', 
        description: 'Errore nella creazione della vendita', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Debug Panel - Temporary for testing */}
      <VATDebugPanel />
      
      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClientSelector
            selectedClient={null}
            onClientSelect={handleClientSelect}
            onClientClear={() => handleClientSelect(null)}
          />
        </CardContent>
      </Card>

      {/* Discount */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Sconto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={formData.discount_type === 'percentage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDiscountTypeChange('percentage')}
              >
                %
              </Button>
              <Button
                variant={formData.discount_type === 'amount' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDiscountTypeChange('amount')}
              >
                €
              </Button>
            </div>
            
            {formData.discount_type && (
              <Input
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
                placeholder={formData.discount_type === 'percentage' ? 'Percentuale' : 'Importo'}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* VAT Mode Selector */}
      <VATModeSelector
        vatIncluded={formData.vat_included}
        onVATModeChange={handleVATModeChange}
        disabled={false}
        id="vat-mode-summary"
      />

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Note aggiuntive..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Errori di validazione:</span>
            </div>
            <ul className="text-sm space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-destructive">• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Totals & Submit */}
      {items.length > 0 && (
        <Card className={`border-primary/20 ${isValid ? 'bg-primary/5' : 'bg-destructive/5'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isValid ? 'text-primary' : 'text-destructive'}`}>
              {isValid ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              Totale Vendita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotale {formData.vat_included ? '(senza IVA)' : '(base)'}:</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>IVA (22%):</span>
                <span>€{taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Totale {formData.discount_type === 'amount' ? '(prima sconto)' : ''}:</span>
                <span>€{(subtotal + taxAmount).toFixed(2)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Sconto {formData.discount_type === 'percentage' ? '(su subtotale)' : '(su totale)'}:</span>
                  <span>-€{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>TOTALE FINALE:</span>
                <span>€{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!isValid || createSale.isPending}
                className="flex-1"
                size="lg"
              >
                <Save className="mr-2 h-4 w-4" />
                {createSale.isPending ? 'Creazione...' : 'Crea Vendita'}
              </Button>
              
              {onCancel && (
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={createSale.isPending}
                  size="lg"
                >
                  Annulla
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}