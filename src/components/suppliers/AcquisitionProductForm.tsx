import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SerialNumbersInput } from '@/components/inventory/SerialNumbersInput';
import type { ProductFormData, UnitEntryForm } from '@/services/inventory/types';

interface AcquisitionProductFormProps {
  productData: ProductFormData;
  onUpdate: (field: keyof ProductFormData, value: any) => void;
  unitEntries: UnitEntryForm[];
  onUpdateUnits: (entries: UnitEntryForm[]) => void;
  categories: Array<{ id: number; name: string; }>;
}

export function AcquisitionProductForm({
  productData,
  onUpdate,
  unitEntries,
  onUpdateUnits,
  categories = []
}: AcquisitionProductFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            value={productData.brand || ''}
            onChange={(e) => onUpdate('brand', e.target.value)}
            placeholder="Enter brand"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            value={productData.model || ''}
            onChange={(e) => onUpdate('model', e.target.value)}
            placeholder="Enter model"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select 
            value={productData.category_id?.toString() || '1'}
            onValueChange={(value) => onUpdate('category_id', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            value={productData.year?.toString() || ''}
            onChange={(e) => onUpdate('year', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="2024"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Base Price (€)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={productData.price?.toString() || ''}
            onChange={(e) => onUpdate('price', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="threshold">Low Stock Threshold</Label>
          <Input
            id="threshold"
            type="number"
            min="0"
            value={productData.threshold?.toString() || ''}
            onChange={(e) => onUpdate('threshold', e.target.value ? parseInt(e.target.value) : 0)}
            placeholder="5"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={productData.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Product description..."
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="has_serial"
          checked={productData.has_serial || false}
          onCheckedChange={(checked) => onUpdate('has_serial', checked)}
        />
        <Label htmlFor="has_serial" className="text-sm font-medium">
          Product has serial numbers / IMEI
        </Label>
      </div>

      {productData.has_serial && (
        <div className="space-y-2">
          <Label>Unit Entries</Label>
          <SerialNumbersInput
            entries={unitEntries}
            setEntries={onUpdateUnits}
            setStock={() => {}} // Stock managed automatically
          />
        </div>
      )}

      {!productData.has_serial && (
        <div className="space-y-2">
          <Label htmlFor="stock">Initial Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={productData.stock?.toString() || ''}
            onChange={(e) => onUpdate('stock', e.target.value ? parseInt(e.target.value) : 0)}
            placeholder="0"
          />
        </div>
      )}
    </div>
  );
}