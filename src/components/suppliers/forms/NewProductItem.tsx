import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { ProductFormFields } from '@/components/inventory/forms/ProductFormFields';
import { UnitManagementSection } from './UnitManagementSection';
import type { AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';
import type { ProductFormData, UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';

interface NewProductItemProps {
  item: AcquisitionItem;
  index: number;
  uniqueBrands: string[];
  uniqueModels: string[];
  onRemove: () => void;
  onUpdateProductData: (productData: Partial<ProductFormData>) => void;
  onUpdateUnitEntries: (unitEntries: UnitEntryFormType[]) => void;
}

export function NewProductItem({
  item,
  index,
  uniqueBrands,
  uniqueModels,
  onRemove,
  onUpdateProductData,
  onUpdateUnitEntries
}: NewProductItemProps) {
  const productData = item.productData!;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">New Product #{index + 1}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Details */}
        <ProductFormFields
          formData={productData}
          onFieldChange={(field, value) => onUpdateProductData({ [field]: value })}
          getFieldError={() => undefined}
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
        {productData.has_serial && (
          <UnitManagementSection
            item={item}
            index={index}
            onUpdateUnitEntries={onUpdateUnitEntries}
            onUpdateProductData={onUpdateProductData}
          />
        )}

        {/* Simple Pricing Display */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Quantity:</span> {item.quantity}
          </div>
          <div className="text-sm">
            <span className="font-medium">Unit Cost:</span> ${item.unitCost?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm font-medium">
            <span>Total:</span> ${(item.quantity * (item.unitCost || 0)).toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}