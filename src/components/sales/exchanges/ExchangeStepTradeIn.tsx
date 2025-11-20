import React, { useState } from 'react';
import { Button } from '@/components/ui/updated-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { ProductSelector } from '../ProductSelector';
import { ExchangeTransactionService } from '@/services/sales/exchanges/ExchangeTransactionService';
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
  };

  const handleRemoveItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (product: any) => {
    setNewItem({
      ...newItem,
      product_id: product.id,
      brand: product.brand,
      model: product.model,
      assessed_value: ExchangeTransactionService.assessTradeInValue(product.price, newItem.condition as TradeInCondition),
    });
  };

  const handleConditionChange = (condition: TradeInCondition) => {
    setNewItem({
      ...newItem,
      condition,
      assessed_value: newItem.product_id && newItem.assessed_value
        ? ExchangeTransactionService.assessTradeInValue(newItem.assessed_value / 0.6, condition)
        : 0,
    });
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
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Cerca Prodotto (Opzionale)</Label>
            <div className="text-sm text-muted-foreground mb-2">
              Cerca nel catalogo per compilare automaticamente i dati del prodotto
            </div>
            <ProductSelector
              onProductAdd={handleProductSelect}
              selectedCategory={undefined}
            />
          </div>

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

        <Button onClick={handleAddItem} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Articolo
        </Button>
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
