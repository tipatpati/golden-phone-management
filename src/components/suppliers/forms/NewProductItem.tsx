import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { ProductFormFields } from '@/components/inventory/forms/ProductFormFields';
import { UnitManagementSection } from './UnitManagementSection';
import { ItemValidationIndicator } from '../components/ItemValidationIndicator';
import type { AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';
import type { ProductFormData, UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';
import type { ItemValidationSummary } from '../hooks/useAcquisitionValidation';

interface NewProductItemProps {
  item: AcquisitionItem;
  index: number;
  uniqueBrands: string[];
  uniqueModels: string[];
  selectedSupplierId?: string;
  onRemove: () => void;
  onUpdateProductData: (productData: Partial<ProductFormData>) => void;
  onUpdateUnitEntries: (unitEntries: UnitEntryFormType[]) => void;
  validationSummary?: ItemValidationSummary;
  getFieldError: (field: string) => string | undefined;
}

export function NewProductItem({
  item,
  index,
  uniqueBrands,
  uniqueModels,
  selectedSupplierId,
  onRemove,
  onUpdateProductData,
  onUpdateUnitEntries,
  validationSummary,
  getFieldError
}: NewProductItemProps) {
  const productData = item.productData!;

  return (
    <Card id={`acquisition-item-${index}`} className={validationSummary && !validationSummary.isValid ? 'border-destructive/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">New Product #{index + 1}</CardTitle>
          {validationSummary && (
            <ItemValidationIndicator summary={validationSummary} itemIndex={index} />
          )}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Details */}
        <ProductFormFields
          formData={productData}
          onFieldChange={(field, value) => onUpdateProductData({ [field]: value })}
          getFieldError={(field) => getFieldError(`productData.${field}`)}
          uniqueBrands={uniqueBrands}
          uniqueModels={uniqueModels}
        />

        {/* Serial Number Toggle */}
        <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
          <Switch
            id={`has_serial_${index}`}
            checked={productData.has_serial || false}
            onCheckedChange={(checked) => onUpdateProductData({ has_serial: checked })}
          />
          <Label htmlFor={`has_serial_${index}`} className="text-sm font-medium">
            Product has serial numbers / IMEI
          </Label>
        </div>

        {/* Unit Management */}
        {productData.has_serial ? (
          <div id={`item-${index}-unit-management`}>
            <UnitManagementSection
              item={item}
              index={index}
              selectedSupplierId={selectedSupplierId}
              onUpdateUnitEntries={onUpdateUnitEntries}
              onUpdateProductData={onUpdateProductData}
              getFieldError={getFieldError}
            />
          </div>
        ) : (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <span className="font-medium">📦 Quantity Tracking:</span> This product is tracked by quantity only. Individual units will not be created.
            </div>
          </div>
        )}

        {/* Simple Pricing Display */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Quantity:</span> {item.quantity}
            {getFieldError('quantity') && (
              <div className="text-xs text-destructive mt-1">{getFieldError('quantity')}</div>
            )}
          </div>
          <div className="text-sm">
            <span className="font-medium">Unit Cost:</span> €{item.unitCost?.toFixed(2) || '0.00'}
            {getFieldError('unitCost') && (
              <div className="text-xs text-destructive mt-1">{getFieldError('unitCost')}</div>
            )}
          </div>
          <div className="text-sm font-medium">
            <span>Total:</span> €{(item.quantity * (item.unitCost || 0)).toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}