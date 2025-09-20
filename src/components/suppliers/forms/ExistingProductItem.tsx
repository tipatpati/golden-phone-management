import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { UnitManagementSection } from './UnitManagementSection';
import { ItemValidationIndicator } from '../components/ItemValidationIndicator';
import type { AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';
import type { UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';
import type { ItemValidationSummary } from '../hooks/useAcquisitionValidation';

interface ExistingProductItemProps {
  item: AcquisitionItem;
  index: number;
  products: any[];
  selectedSupplierId?: string;
  onRemove: () => void;
  onUpdateItem: (updates: Partial<AcquisitionItem>) => void;
  onUpdateUnitEntries: (unitEntries: UnitEntryFormType[]) => void;
  validationSummary?: ItemValidationSummary;
  getFieldError: (field: string) => string | undefined;
}

export function ExistingProductItem({
  item,
  index,
  products,
  selectedSupplierId,
  onRemove,
  onUpdateItem,
  onUpdateUnitEntries,
  validationSummary,
  getFieldError
}: ExistingProductItemProps) {
  const selectedProduct = products.find(p => p.id === item.productId);

  return (
    <Card id={`acquisition-item-${index}`} className={validationSummary && !validationSummary.isValid ? 'border-destructive/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Existing Product #{index + 1}</CardTitle>
          {validationSummary && (
            <ItemValidationIndicator summary={validationSummary} itemIndex={index} />
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Selection */}
        <div className="space-y-2">
          <Label>Product</Label>
          <Select 
            value={item.productId || ''}
            onValueChange={(value) => {
              const selectedProduct = products.find(p => p.id === value);
              onUpdateItem({ 
                productId: value,
                unitEntries: [],
                quantity: selectedProduct?.has_serial ? 0 : 1
              });
            }}
          >
            <SelectTrigger className={getFieldError('productId') ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.brand} {product.model} {product.has_serial ? '(Serialized)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getFieldError('productId') && (
            <p className="text-sm text-destructive">{getFieldError('productId')}</p>
          )}
        </div>

        {/* Non-serialized product quantity and cost */}
        {selectedProduct && !selectedProduct.has_serial && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => onUpdateItem({ quantity: parseInt(e.target.value) || 1 })}
                className={getFieldError('quantity') ? 'border-destructive' : ''}
              />
              {getFieldError('quantity') && (
                <p className="text-sm text-destructive">{getFieldError('quantity')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unitCost || ''}
                onChange={(e) => onUpdateItem({ unitCost: parseFloat(e.target.value) || 0 })}
                className={getFieldError('unitCost') ? 'border-destructive' : ''}
              />
              {getFieldError('unitCost') && (
                <p className="text-sm text-destructive">{getFieldError('unitCost')}</p>
              )}
            </div>
          </div>
        )}

        {/* Serialized product management */}
        {selectedProduct?.has_serial && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ This product uses serial numbers. Add specific units below.
              </p>
            </div>
            
            <div id={`item-${index}-unit-management`}>
              <UnitManagementSection
                item={item}
                index={index}
                selectedSupplierId={selectedSupplierId}
                onUpdateUnitEntries={onUpdateUnitEntries}
                isExistingProduct={true}
                getFieldError={getFieldError}
              />
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Quantity:</span> {item.quantity}
          </div>
          <div className="text-sm">
            <span className="font-medium">Unit Cost:</span> €{item.unitCost?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm font-medium">
            <span>Total:</span> €{(item.quantity * (item.unitCost || 0)).toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}