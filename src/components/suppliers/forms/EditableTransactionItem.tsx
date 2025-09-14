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
import { StoragePricingTemplateSelector } from '@/components/pricing/StoragePricingTemplateSelector';
import { usePendingPricingChanges, type PendingPricingChange } from '@/hooks/usePendingPricingChanges';
import { PendingPricingPreview } from '@/components/pricing/PendingPricingPreview';
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
  const {
    pendingChanges,
    hasPendingChanges,
    addPendingChanges,
    clearPendingChanges,
    applyPendingChanges,
    getPendingChangeForUnit,
    calculateTotalWithPending
  } = usePendingPricingChanges();
  
  const selectedProduct = products.find(p => p.id === item.product_id);
  const hasIndividualPricing = selectedProduct?.has_serial && unitEntries?.length > 0;
  
  // Calculate totals with pending changes consideration
  const baseTotal = calculateItemTotal(item, index);
  const totalWithPending = hasIndividualPricing && hasPendingChanges 
    ? calculateTotalWithPending(unitEntries, item.unit_cost)
    : baseTotal;
  
  const itemTotal = totalWithPending;

  const handleUpdateBarcodes = (barcodes: string[]) => {
    onUpdateItem(index, 'unit_barcodes', barcodes);
  };

  // Handler for pricing template preview
  const handlePreviewPricing = (originalUnits: UnitEntryFormType[], updatedUnits: UnitEntryFormType[], templateName?: string) => {
    // Create pending changes for units that will be modified
    const changes: PendingPricingChange[] = [];
    
    updatedUnits.forEach((updatedUnit, unitIndex) => {
      const originalUnit = originalUnits[unitIndex];
      if (originalUnit && (
        originalUnit.price !== updatedUnit.price ||
        originalUnit.min_price !== updatedUnit.min_price ||
        originalUnit.max_price !== updatedUnit.max_price
      )) {
        changes.push({
          unitIndex,
          originalUnit,
          proposedUnit: updatedUnit,
          changeType: 'template_applied',
          templateName
        });
      }
    });
    
    if (changes.length > 0) {
      addPendingChanges(changes);
    }
  };

  // Handler for applying pending pricing changes
  const handleApplyPendingChanges = () => {
    console.log('🎯 Applying pending pricing changes for item', index);
    console.log('📊 Original units:', unitEntries.map(u => ({ serial: u.serial, price: u.price })));
    applyPendingChanges(unitEntries, (updatedUnits) => {
      console.log('✨ Updated units:', updatedUnits.map(u => ({ serial: u.serial, price: u.price })));
      console.log('🔄 Triggering onUpdateUnitEntries callback to sync parent state');
      // Critical: This callback updates the parent dialog's itemUnitEntries state
      // which is what gets saved to unit_details.entries in the database
      onUpdateUnitEntries(index, updatedUnits);
    });
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
            <div className="flex items-center gap-4">
              <div className="text-sm">
                {hasPendingChanges && hasIndividualPricing ? (
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground line-through">
                      ${baseTotal.toFixed(2)}
                    </span>
                    <span className="font-medium text-orange-600">
                      ${itemTotal.toFixed(2)} (pending)
                    </span>
                  </div>
                ) : (
                  <span className="font-medium">
                    Total: ${itemTotal.toFixed(2)}
                  </span>
                )}
              </div>
              {hasIndividualPricing && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  Individual Pricing
                </span>
              )}
              {selectedProduct?.has_serial && (
                <span className="text-xs px-2 py-1 bg-accent/20 text-accent-foreground rounded-full">
                  Serialized Product
                </span>
              )}
            </div>
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
            {/* Product Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
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
                        <div className="flex items-center gap-2">
                          <span>{product.brand} {product.model}</span>
                          {product.has_serial && (
                            <span className="text-xs px-1 py-0.5 bg-accent/20 text-accent-foreground rounded">
                              Serialized
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                />
                {selectedProduct?.has_serial && (
                  <p className="text-xs text-muted-foreground">
                    Each unit requires individual serial number
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`unit-cost-${index}`}>
                  {selectedProduct?.has_serial ? 'Base Unit Cost' : 'Unit Cost'}
                </Label>
                <Input
                  id={`unit-cost-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unit_cost}
                  onChange={(e) => onUpdateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                />
                {selectedProduct?.has_serial && (
                  <p className="text-xs text-muted-foreground">
                    Default price, can be overridden per unit
                  </p>
                )}
              </div>
            </div>

            {/* Unit Management for Serialized Products */}
            {selectedProduct?.has_serial && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Individual Unit Management
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Configure serial numbers, pricing, and specifications for each unit
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleUnitEditing(index)}
                  >
                    {editingUnits ? "Hide Editor" : "Edit Units"}
                  </Button>
                </div>

                {editingUnits && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Individual Unit Management</h5>
                      <span className="text-sm text-muted-foreground">
                        Configure each unit with unique pricing and details
                      </span>
                    </div>
                    
                    {/* Pending Pricing Changes Preview */}
                    {hasPendingChanges && (
                      <PendingPricingPreview
                        pendingChanges={pendingChanges}
                        onApplyChanges={handleApplyPendingChanges}
                        onCancelChanges={clearPendingChanges}
                      />
                    )}

                    <StoragePricingTemplateSelector
                      units={unitEntries}
                      onUnitsChange={(updatedUnits) => {
                        console.log('🏷️ Template directly updating units for item', index);
                        console.log('📈 Template updated units:', updatedUnits.map(u => ({ serial: u.serial, price: u.price })));
                        onUpdateUnitEntries(index, updatedUnits);
                      }}
                      onPreviewPricing={handlePreviewPricing}
                      title="Apply Pricing Template to Units"
                      description="Select a template to automatically set pricing based on storage capacity"
                    />
                    
                    <UnitEntryForm
                      entries={unitEntries}
                      setEntries={(entries) => onUpdateUnitEntries(index, entries)}
                      showPricing={true}
                      productId={item.product_id}
                      showBarcodeActions={true}
                      showPricingTemplates={false} // We show it separately above
                      title={`Units for ${selectedProduct.brand} ${selectedProduct.model}`}
                      className="bg-background"
                    />
                    
                    <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                      💡 <strong>Tip:</strong> Use pricing templates to quickly apply storage-based pricing, 
                      or set individual prices for each unit. The total will automatically update based on 
                      individual unit prices when specified.
                    </div>
                  </div>
                )}

                  <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Item Total:</span>
                    <div className="text-right">
                      {hasPendingChanges && hasIndividualPricing ? (
                        <div>
                          <div className="text-muted-foreground line-through text-xs">
                            Current: ${baseTotal.toFixed(2)}
                          </div>
                          <div className="font-semibold text-orange-600">
                            Pending: ${itemTotal.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="font-semibold">${itemTotal.toFixed(2)}</div>
                      )}
                      {hasIndividualPricing && (
                        <div className="text-muted-foreground text-xs">
                          ({unitEntries.length} units × individual pricing)
                        </div>
                      )}
                      {!hasIndividualPricing && (
                        <div className="text-muted-foreground text-xs">
                          ({item.quantity} × ${item.unit_cost.toFixed(2)})
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {hasIndividualPricing && unitEntries.length > 0 && (
                    <div className="mt-2 p-2 bg-accent/10 rounded text-xs">
                      <div className="font-medium mb-1">Unit Breakdown:</div>
                      <div className="grid grid-cols-2 gap-1">
                        {unitEntries.slice(0, 6).map((entry, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{entry.serial || `Unit ${idx + 1}`}:</span>
                            <span>${(entry.price || item.unit_cost).toFixed(2)}</span>
                          </div>
                        ))}
                        {unitEntries.length > 6 && (
                          <div className="col-span-2 text-center text-muted-foreground">
                            +{unitEntries.length - 6} more units...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Barcode Management for Non-Serialized Products */}
            {selectedProduct && !selectedProduct.has_serial && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor={`barcodes-${index}`} className="font-medium">Barcode Management</Label>
                    <p className="text-sm text-muted-foreground">
                      Add barcodes for product units (one per line or comma-separated)
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(item.unit_barcodes?.length || 0)} barcodes
                  </span>
                </div>
                <Textarea
                  id={`barcodes-${index}`}
                  value={(item.unit_barcodes || []).join('\n')}
                  onChange={(e) => handleUpdateBarcodes(e.target.value.split(/\n|,/).map(s => s.trim()).filter(Boolean))}
                  placeholder="Enter barcodes (one per line)..."
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}