import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit3 } from "lucide-react";
import { UnitEntryForm } from "@/components/shared/forms/UnitEntryForm";
import type { EditableTransactionItem } from "@/services/suppliers/types";
import type { ProductUnit, UnitEntryForm as UnitEntryFormType } from "@/services/inventory/types";

interface TransactionItemEditorProps {
  item: EditableTransactionItem;
  index: number;
  products: any[];
  productUnits: Record<string, ProductUnit[]>;
  itemUnitEntries: Record<number, UnitEntryFormType[]>;
  editingUnits: Record<number, boolean>;
  canDelete: boolean;
  onUpdateItem: (index: number, field: keyof EditableTransactionItem, value: any) => void;
  onRemoveItem: (index: number) => void;
  onUpdateUnitEntries: (itemIndex: number, entries: UnitEntryFormType[]) => void;
  onToggleUnitEditing: (itemIndex: number) => void;
  calculateItemTotal: (item: EditableTransactionItem, index: number) => number;
}

export function TransactionItemEditor({
  item,
  index,
  products,
  productUnits,
  itemUnitEntries,
  editingUnits,
  canDelete,
  onUpdateItem,
  onRemoveItem,
  onUpdateUnitEntries,
  onToggleUnitEditing,
  calculateItemTotal
}: TransactionItemEditorProps) {
  const product = products.find(p => p.id === item.product_id);
  const isSerializedProduct = product?.has_serial;
  const unitEntries = itemUnitEntries[index] || [];
  const isEditingUnits = editingUnits[index];

  return (
    <Card key={index} className="border-2 border-gray-200">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Item {index + 1}</h4>
          {canDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRemoveItem(index)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`product-${index}`}>Product</Label>
            <Select
              value={item.product_id}
              onValueChange={(value) => onUpdateItem(index, 'product_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.brand} {product.model}
                    {product.has_serial && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                        Serial
                      </span>
                    )}
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
              onChange={(e) => onUpdateItem(index, 'quantity', parseInt(e.target.value, 10) || 1)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`unit-cost-${index}`}>
              {isSerializedProduct ? 'Default Cost' : 'Unit Cost'}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
              <Input
                id={`unit-cost-${index}`}
                type="number"
                step="0.01"
                min="0"
                value={item.unit_cost}
                onChange={(e) => onUpdateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Serial product unit details */}
        {isSerializedProduct && product && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className="font-medium text-sm">Product Units</h5>
              {unitEntries.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleUnitEditing(index)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {isEditingUnits ? 'Hide Editor' : 'Edit Units'}
                </Button>
              )}
            </div>

            {unitEntries.length > 0 && isEditingUnits && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  <p>Individual unit pricing (edit purchase prices):</p>
                </div>
                {unitEntries.map((entry, entryIndex) => (
                  <div key={entryIndex} className="grid grid-cols-4 gap-2 mb-2 p-2 bg-white rounded border">
                    <div>
                      <Label className="text-xs">Serial</Label>
                      <Input 
                        value={entry.serial} 
                        onChange={(e) => {
                          const newEntries = [...unitEntries];
                          newEntries[entryIndex] = { ...entry, serial: e.target.value };
                          onUpdateUnitEntries(index, newEntries);
                        }}
                        className="text-xs h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price €</Label>
                      <Input 
                        type="number"
                        step="0.01"
                        value={entry.price || ''} 
                        onChange={(e) => {
                          const newEntries = [...unitEntries];
                          newEntries[entryIndex] = { ...entry, price: parseFloat(e.target.value) || 0 };
                          onUpdateUnitEntries(index, newEntries);
                        }}
                        className="text-xs h-8"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Storage</Label>
                      <Input 
                        type="number"
                        value={entry.storage || ''} 
                        onChange={(e) => {
                          const newEntries = [...unitEntries];
                          newEntries[entryIndex] = { ...entry, storage: parseInt(e.target.value) || undefined };
                          onUpdateUnitEntries(index, newEntries);
                        }}
                        className="text-xs h-8"
                        placeholder="GB"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input 
                        value={entry.color || ''} 
                        onChange={(e) => {
                          const newEntries = [...unitEntries];
                          newEntries[entryIndex] = { ...entry, color: e.target.value };
                          onUpdateUnitEntries(index, newEntries);
                        }}
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {unitEntries.length > 0 && !isEditingUnits && (
              <div className="text-sm text-gray-600">
                <p>{unitEntries.length} units configured</p>
                <p>Serials: {unitEntries.map(e => e.serial).join(', ')}</p>
              </div>
            )}

            {unitEntries.length === 0 && (
              <p className="text-sm text-gray-500">
                Configure product units in the main transaction dialog
              </p>
            )}
          </div>
        )}

        {/* Item total */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center font-medium">
            <span>Item Total:</span>
            <span className="text-lg">€{calculateItemTotal(item, index).toFixed(2)}</span>
          </div>
          {isSerializedProduct && unitEntries.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Based on individual unit pricing
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}