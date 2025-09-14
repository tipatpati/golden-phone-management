import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Trash2, Edit3 } from 'lucide-react';
import { UnitEntryForm } from '@/components/shared/forms/UnitEntryForm';
import type { EditableTransactionItem as EditableTransactionItemType } from '@/services/suppliers/types';
import type { Product } from '@/services/inventory/types';
import type { UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';

interface EditableTransactionItemProps {
  item: EditableTransactionItemType;
  index: number;
  products: Product[];
  unitEntries: UnitEntryFormType[];
  editingUnits: boolean;
  canDelete: boolean;
  onUpdateItem: (index: number, field: keyof EditableTransactionItemType, value: any) => void;
  onRemoveItem: (index: number) => void;
  onUpdateUnitEntries: (itemIndex: number, entries: UnitEntryFormType[]) => void;
  onToggleUnitEditing: (itemIndex: number) => void;
  calculateItemTotal: (item: EditableTransactionItemType, index: number) => number;
}

export function EditableTransactionItem({
  item,
  index,
  products,
  unitEntries,
  editingUnits,
  canDelete,
  onUpdateItem,
  onRemoveItem,
  onUpdateUnitEntries,
  onToggleUnitEditing,
  calculateItemTotal
}: EditableTransactionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedProduct = products.find(p => p.id === item.product_id);
  const itemTotal = calculateItemTotal(item, index);
  const hasIndividualPricing = selectedProduct?.has_serial && unitEntries?.length > 0;

  const handleUpdateBarcodes = (barcodes: string[]) => {
    onUpdateItem(index, 'unit_barcodes', barcodes);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            Product Item #{index + 1}
            {selectedProduct && (
              <span className="text-sm text-muted-foreground">
                - {selectedProduct.brand} {selectedProduct.model}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Total: ${itemTotal.toFixed(2)}
              {hasIndividualPricing && (
                <span className="text-muted-foreground ml-1">(individual pricing)</span>
              )}
            </span>
            {canDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveItem(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Product Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`product-${index}`}>Product</Label>
                <Select
                  value={item.product_id}
                  onValueChange={(value) => onUpdateItem(index, 'product_id', value)}
                >
                  <SelectTrigger id={`product-${index}`}>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.brand} {product.model}
                        {product.has_serial && ' (Serialized)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label htmlFor={`unit-cost-${index}`}>Unit Cost</Label>
                <Input
                  id={`unit-cost-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unit_cost}
                  onChange={(e) => onUpdateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Unit Management for Serialized Products */}
            {selectedProduct?.has_serial && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Unit Management</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleUnitEditing(index)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {editingUnits ? "Hide" : "Edit"} Units
                  </Button>
                </div>

                {editingUnits && (
                  <div className="border rounded-lg p-4">
                    <UnitEntryForm
                      entries={unitEntries}
                      setEntries={(entries) => onUpdateUnitEntries(index, entries)}
                      showPricing={true}
                      productId={item.product_id}
                      showBarcodeActions={true}
                      showPricingTemplates={false}
                    />
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Total for this item: ${itemTotal.toFixed(2)}
                  {unitEntries?.length > 0 && " (based on individual unit pricing)"}
                </div>
              </div>
            )}

            {/* Barcode Management for Non-Serialized Products */}
            {selectedProduct && !selectedProduct.has_serial && (
              <div className="space-y-2">
                <Label htmlFor={`barcodes-${index}`}>Barcodes (one per line or comma-separated)</Label>
                <Textarea
                  id={`barcodes-${index}`}
                  value={(item.unit_barcodes || []).join('\n')}
                  onChange={(e) => handleUpdateBarcodes(e.target.value.split(/\n|,/).map(s => s.trim()).filter(Boolean))}
                  placeholder="Enter barcodes..."
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}