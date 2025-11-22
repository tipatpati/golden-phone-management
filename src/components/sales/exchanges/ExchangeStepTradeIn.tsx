import { useState } from 'react';
import { Button } from '@/components/ui/updated-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Info } from 'lucide-react';
import { ProductSelector } from '../ProductSelector';
import { BrandModelSelector } from './BrandModelSelector';
import { ExchangeTransactionService } from '@/services/sales/exchanges/ExchangeTransactionService';
import { tradeInPricingSuggestionService } from '@/services/sales/exchanges/TradeInPricingSuggestionService';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { TradeInItem, TradeInCondition } from '@/services/sales/exchanges/types';

interface ExchangeStepTradeInProps {
  items: TradeInItem[];
  onItemsChange: (items: TradeInItem[]) => void;
  assessmentNotes: string;
  onAssessmentNotesChange: (notes: string) => void;
}

export function ExchangeStepTradeIn({
  items,
  onItemsChange,
  assessmentNotes,
  onAssessmentNotesChange,
}: ExchangeStepTradeInProps) {
  const [newItem, setNewItem] = useState<Partial<TradeInItem>>({
    brand: '',
    model: '',
    condition: 'good',
    assessed_value: 0,
    was_originally_sold_here: false,
  });
  const [pricingSuggestion, setPricingSuggestion] = useState<{
    historicalPrice: number | null;
    suggestedValue: number | null;
  } | null>(null);

  const handleAddItem = () => {
    if (!newItem.brand || !newItem.model || !newItem.assessed_value) {
      return;
    }

    const item: TradeInItem = {
      brand: newItem.brand,
      model: newItem.model,
      serial_number: newItem.serial_number,
      imei: newItem.imei,
      condition: newItem.condition as TradeInCondition,
      assessed_value: newItem.assessed_value,
      assessment_notes: newItem.assessment_notes,
      was_originally_sold_here: newItem.was_originally_sold_here || false,
      product_id: newItem.product_id,
      custom_product_description: newItem.custom_product_description,
    };

    onItemsChange([...items, item]);
    
    // Reset form
    setNewItem({
      brand: '',
      model: '',
      condition: 'good',
      assessed_value: 0,
      was_originally_sold_here: false,
    });
    setPricingSuggestion(null);
  };

  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = async (product: any) => {
    setNewItem({
      ...newItem,
      product_id: product.id,
      brand: product.brand,
      model: product.model,
    });

    // Get pricing suggestion from actual product
    const price = await tradeInPricingSuggestionService.getPricingFromProduct(product.id);
    if (price && newItem.condition) {
      const suggestedValue = tradeInPricingSuggestionService.calculateSuggestedTradeInValue(
        price,
        newItem.condition as TradeInCondition
      );
      setPricingSuggestion({
        historicalPrice: price,
        suggestedValue
      });
      setNewItem(prev => ({ ...prev, assessed_value: suggestedValue }));
    }
  };

  const handleBrandModelSelect = async (selection: {
    brand: string;
    model: string;
    category_id?: number;
    product_id?: string;
  }) => {
    setNewItem(prev => ({
      ...prev,
      brand: selection.brand,
      model: selection.model,
      product_id: selection.product_id,
    }));

    // Get pricing suggestion
    if (selection.brand && selection.model && newItem.condition) {
      const suggestion = await tradeInPricingSuggestionService.getPricingSuggestion(
        selection.brand,
        selection.model,
        newItem.condition as TradeInCondition
      );
      if (suggestion.hasHistoricalData && suggestion.suggestedValue) {
        setPricingSuggestion({
          historicalPrice: suggestion.historicalPrice,
          suggestedValue: suggestion.suggestedValue
        });
        setNewItem(prev => ({ ...prev, assessed_value: suggestion.suggestedValue || 0 }));
      }
    }
  };

  const handleConditionChange = async (condition: TradeInCondition) => {
    setNewItem(prev => ({
      ...prev,
      condition,
    }));

    // Recalculate pricing suggestion with new condition
    if (newItem.brand && newItem.model) {
      if (newItem.product_id) {
        const price = await tradeInPricingSuggestionService.getPricingFromProduct(newItem.product_id);
        if (price) {
          const suggestedValue = tradeInPricingSuggestionService.calculateSuggestedTradeInValue(
            price,
            condition
          );
          setPricingSuggestion({
            historicalPrice: price,
            suggestedValue
          });
          setNewItem(prev => ({ ...prev, assessed_value: suggestedValue }));
        }
      } else {
        const suggestion = await tradeInPricingSuggestionService.getPricingSuggestion(
          newItem.brand,
          newItem.model,
          condition
        );
        if (suggestion.hasHistoricalData && suggestion.suggestedValue) {
          setPricingSuggestion({
            historicalPrice: suggestion.historicalPrice,
            suggestedValue: suggestion.suggestedValue
          });
          setNewItem(prev => ({ ...prev, assessed_value: suggestion.suggestedValue || 0 }));
        }
      }
    }
  };

  const totalTradeIn = items.reduce((sum, item) => sum + item.assessed_value, 0);

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Articoli in Permuta</h3>
        <p className="text-sm text-muted-foreground">
          Valuta gli articoli che il cliente sta cedendo in permuta.
        </p>
      </div>

      {/* Add New Item Form */}
      <Card className="p-4 space-y-6">
        {/* Product Search - Option 1 */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              📦 Opzione 1: Cerca Prodotto in Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ProductSelector
              onProductAdd={handleProductSelect}
              selectedCategory={undefined}
            />
            <p className="text-xs text-muted-foreground">
              Utilizza questa opzione se il modello è attualmente in stock
            </p>
          </CardContent>
        </Card>

        {/* Brand/Model Search - Option 2 */}
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              🏷️ Opzione 2: Cerca Modello Conosciuto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BrandModelSelector onSelect={handleBrandModelSelect} />
          </CardContent>
        </Card>

        <Separator className="my-4" />

        {/* Manual Entry Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            ✍️ Compilazione Manuale
          </h3>

          {/* Pricing Suggestion Alert */}
          {pricingSuggestion && pricingSuggestion.suggestedValue !== null && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <div className="space-y-1">
                  {pricingSuggestion.historicalPrice && (
                    <div>
                      Prezzo medio storico: <strong>€{pricingSuggestion.historicalPrice.toFixed(2)}</strong>
                    </div>
                  )}
                  <div>
                    Valore suggerito in condizione <strong>{newItem.condition}</strong>: <strong>€{pricingSuggestion.suggestedValue.toFixed(2)}</strong>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Marca *</Label>
              <Input
                value={newItem.brand}
                onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                placeholder="Es: Apple, Samsung..."
              />
            </div>

            <div>
              <Label>Modello *</Label>
              <Input
                value={newItem.model}
                onChange={(e) => setNewItem({ ...newItem, model: e.target.value })}
                placeholder="Es: iPhone 14 Pro"
              />
            </div>

            <div>
              <Label>Numero di Serie / IMEI</Label>
              <Input
                value={newItem.serial_number || ''}
                onChange={(e) => setNewItem({ ...newItem, serial_number: e.target.value })}
                placeholder="Opzionale"
              />
            </div>

            <div>
              <Label>Condizione *</Label>
              <Select
                value={newItem.condition}
                onValueChange={(value) => handleConditionChange(value as TradeInCondition)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Eccellente</SelectItem>
                  <SelectItem value="good">Buono</SelectItem>
                  <SelectItem value="fair">Discreto</SelectItem>
                  <SelectItem value="poor">Scadente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Valore Valutato (€) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newItem.assessed_value}
                onChange={(e) => setNewItem({ ...newItem, assessed_value: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="col-span-2">
              <Label>Note di Valutazione</Label>
              <Textarea
                value={newItem.assessment_notes || ''}
                onChange={(e) => setNewItem({ ...newItem, assessment_notes: e.target.value })}
                placeholder="Graffi, danni, accessori inclusi..."
                rows={2}
              />
            </div>
          </div>

          {/* Add Button */}
          <Button onClick={handleAddItem} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Articolo
          </Button>
        </div>
      </Card>

      {/* Trade-In Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <Label>Articoli Aggiunti ({items.length})</Label>
          {items.map((item, index) => (
            <Card key={index} className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold">
                    {item.brand} {item.model}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Condizione: {ExchangeTransactionService.getConditionLabel(item.condition)}
                  </div>
                  {item.serial_number && (
                    <div className="text-xs text-muted-foreground">
                      S/N: {item.serial_number}
                    </div>
                  )}
                  <div className="font-semibold text-green-600 mt-1">
                    €{item.assessed_value.toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}

          <div className="flex justify-between items-center p-3 bg-muted rounded-lg font-semibold">
            <span>Totale Permuta:</span>
            <span className="text-green-600">€{totalTradeIn.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* General Assessment Notes */}
      <div>
        <Label>Note Generali di Valutazione</Label>
        <Textarea
          value={assessmentNotes}
          onChange={(e) => onAssessmentNotesChange(e.target.value)}
          placeholder="Note generali sulla valutazione complessiva..."
          rows={3}
        />
      </div>
    </div>
  );
}