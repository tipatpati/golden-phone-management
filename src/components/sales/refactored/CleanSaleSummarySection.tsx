import React, { useState } from 'react';
import { CheckCircle2, Calculator, FileText, Percent, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { VATModeSelector } from '../VATModeSelector';
import { useSaleCreation } from '@/contexts/SaleCreationContext';
import { useCreateSale } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CleanSaleSummarySectionProps {
  onSaleComplete?: (sale: any) => void;
  onCancel?: () => void;
}

export function CleanSaleSummarySection({ onSaleComplete, onCancel }: CleanSaleSummarySectionProps) {
  const { state, updateFormData } = useSaleCreation();
  const { items, formData, totalAmount, subtotal, discountAmount, taxAmount, isValid, validationErrors } = state;
  const { user } = useAuth();
  const createSale = useCreateSale();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDiscountTypeChange = (type: 'percentage' | 'amount') => {
    updateFormData({ discount_type: type });
  };

  const handleDiscountValueChange = (value: number) => {
    updateFormData({ discount_value: value });
  };

  const handleNotesChange = (notes: string) => {
    updateFormData({ notes });
  };

  const handleVATModeChange = (vatIncluded: boolean) => {
    console.log('🔄 CleanSaleSummarySection - handleVATModeChange:', vatIncluded);
    updateFormData({ vat_included: vatIncluded });
  };

  const handleSubmit = async () => {
    if (!isValid || !user) {
      toast.error('Verifica i dati della vendita');
      return;
    }

    setIsSubmitting(true);
    try {
      const saleData = {
        salesperson_id: user.id,
        client_id: formData.client_id,
        payment_method: formData.payment_method as any,
        payment_type: formData.payment_type || 'single',
        cash_amount: formData.cash_amount || 0,
        card_amount: formData.card_amount || 0,
        bank_transfer_amount: formData.bank_transfer_amount || 0,
        discount_amount: discountAmount,
        discount_percentage: formData.discount_type === 'percentage' ? formData.discount_value : undefined,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        vat_included: formData.vat_included,
        notes: formData.notes || '',
        sale_items: items.map(item => ({
          product_id: item.product_id,
          product_unit_id: item.product_unit_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          serial_number: item.serial_number || undefined,
          barcode: item.barcode || undefined,
        })),
      };

      const newSale = await createSale.mutateAsync(saleData);
      toast.success('Vendita creata con successo!');
      onSaleComplete?.(newSale);
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Errore durante la creazione della vendita');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* VAT Mode Selector */}
      <VATModeSelector
        vatIncluded={formData.vat_included}
        onVATModeChange={handleVATModeChange}
        disabled={false}
        id="vat-mode-clean"
      />

      {/* Discount Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium text-on-surface">Sconto</Label>
        </div>
        
        <div className="p-3 bg-surface-container rounded-lg border border-border/30 space-y-3">
          <RadioGroup
            value={formData.discount_type}
            onValueChange={handleDiscountTypeChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="percentage" id="percentage" />
              <Label htmlFor="percentage" className="text-sm">%</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="amount" id="amount" />
              <Label htmlFor="amount" className="text-sm">€</Label>
            </div>
          </RadioGroup>
          
          <div className="relative">
            {formData.discount_type === 'percentage' ? (
              <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            ) : (
              <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              type="number"
              value={formData.discount_value || ''}
              onChange={(e) => handleDiscountValueChange(parseFloat(e.target.value) || 0)}
              className="pl-10 h-9 text-sm"
              placeholder={formData.discount_type === 'percentage' ? '0%' : '0.00€'}
              step={formData.discount_type === 'percentage' ? '1' : '0.01'}
              min="0"
              max={formData.discount_type === 'percentage' ? '100' : undefined}
            />
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium text-on-surface">Note</Label>
        </div>
        <Textarea
          value={formData.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Note aggiuntive..."
          className="min-h-16 text-sm bg-surface-container border-border/30"
        />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm font-medium text-destructive mb-1">Errori:</p>
          <ul className="text-xs text-destructive space-y-0.5">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="p-4 bg-primary-container/20 rounded-lg border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium text-on-surface">Riepilogo</Label>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Subtotale {formData.vat_included ? '(senza IVA)' : '(base)'}:
            </span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA (22%):</span>
            <span>€{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Totale {formData.discount_type === 'amount' ? '(prima sconto)' : ''}:</span>
            <span>€{(subtotal + taxAmount).toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Sconto {formData.discount_type === 'percentage' ? '(su subtotale)' : '(su totale)'}:</span>
              <span>-€{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-border/30 pt-2 mt-2">
            <div className="flex justify-between font-bold text-base">
              <span>Totale finale:</span>
              <span className="text-primary">€{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1 h-12"
          size="lg"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Creazione...' : 'Crea Vendita'}
        </Button>
        
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="px-6 h-12"
            disabled={isSubmitting}
          >
            Annulla
          </Button>
        )}
      </div>
    </div>
  );
}