import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Calculator, Euro, Package, Target } from 'lucide-react';
import type { AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';
import type { UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';

interface AcquisitionPricingManagerProps {
  item: AcquisitionItem;
  index: number;
  onUpdateItem: (index: number, updates: Partial<AcquisitionItem>) => void;
  onUpdateUnitEntries: (index: number, entries: UnitEntryFormType[]) => void;
}

export function AcquisitionPricingManager({ 
  item, 
  index, 
  onUpdateItem, 
  onUpdateUnitEntries 
}: AcquisitionPricingManagerProps) {
  const [pricingMode, setPricingMode] = useState<'bulk' | 'individual'>('bulk');
  const [defaultUnitCost, setDefaultUnitCost] = useState(item.unitCost || 0);

  const hasIndividualPricing = useMemo(() => {
    return item.unitEntries.some(entry => entry.price && entry.price > 0);
  }, [item.unitEntries]);

  const totalFromIndividualPricing = useMemo(() => {
    return item.unitEntries.reduce((sum, entry) => sum + (entry.price || 0), 0);
  }, [item.unitEntries]);

  const averageUnitCost = useMemo(() => {
    if (item.unitEntries.length === 0) return defaultUnitCost;
    const validPrices = item.unitEntries.filter(entry => entry.price && entry.price > 0);
    if (validPrices.length === 0) return defaultUnitCost;
    return validPrices.reduce((sum, entry) => sum + (entry.price || 0), 0) / validPrices.length;
  }, [item.unitEntries, defaultUnitCost]);

  const handleBulkPricingChange = useCallback((newCost: number) => {
    setDefaultUnitCost(newCost);
    onUpdateItem(index, { unitCost: newCost });
    
    // Apply to product price if creating new product
    if (item.createsNewProduct && item.productData) {
      onUpdateItem(index, { 
        productData: { ...item.productData, price: newCost }
      });
    }
  }, [index, item, onUpdateItem]);

  const handleApplyBulkToUnits = useCallback(() => {
    const updatedEntries = item.unitEntries.map(entry => ({
      ...entry,
      price: defaultUnitCost
    }));
    onUpdateUnitEntries(index, updatedEntries);
  }, [index, defaultUnitCost, item.unitEntries, onUpdateUnitEntries]);

  const handleClearIndividualPricing = useCallback(() => {
    const updatedEntries = item.unitEntries.map(entry => ({
      ...entry,
      price: undefined
    }));
    onUpdateUnitEntries(index, updatedEntries);
  }, [index, item.unitEntries, onUpdateUnitEntries]);

  const isSerializedProduct = item.createsNewProduct 
    ? item.productData?.has_serial 
    : false; // For existing products, this would need to be determined from product data

  const currentTotal = hasIndividualPricing 
    ? totalFromIndividualPricing 
    : (item.unitCost || 0) * item.quantity;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="w-4 h-4" />
          Acquisition Pricing Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pricing Strategy Selection */}
        {isSerializedProduct && item.unitEntries.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pricing Strategy</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={pricingMode === 'bulk' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPricingMode('bulk')}
              >
                <Package className="w-4 h-4 mr-1" />
                Bulk Pricing
              </Button>
              <Button
                type="button"
                variant={pricingMode === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPricingMode('individual')}
              >
                <Target className="w-4 h-4 mr-1" />
                Individual Unit Pricing
              </Button>
            </div>
          </div>
        )}

        {/* Bulk Pricing Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Default Unit Cost</Label>
            <Badge variant={hasIndividualPricing ? 'secondary' : 'default'}>
              {hasIndividualPricing ? 'Override Active' : 'Active'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Unit Cost (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={defaultUnitCost}
                onChange={(e) => handleBulkPricingChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <Input
                type="number"
                value={item.quantity}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          {isSerializedProduct && item.unitEntries.length > 0 && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyBulkToUnits}
                className="flex-1"
              >
                Apply to All Units
              </Button>
              {hasIndividualPricing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearIndividualPricing}
                  className="flex-1"
                >
                  Clear Individual Pricing
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Individual Pricing Status */}
        {isSerializedProduct && item.unitEntries.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Individual Unit Pricing Status</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Units with individual prices:</p>
                  <p className="font-medium">
                    {item.unitEntries.filter(entry => entry.price && entry.price > 0).length} / {item.unitEntries.length}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Average unit cost:</p>
                  <p className="font-medium">€{averageUnitCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total Calculation Display */}
        <div className="space-y-3">
          <Separator />
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4 text-primary" />
              <span className="font-medium">Total Acquisition Cost</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">€{currentTotal.toFixed(2)}</p>
              {hasIndividualPricing && (
                <p className="text-xs text-muted-foreground">
                  Based on individual unit pricing
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        {hasIndividualPricing && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Individual unit prices take precedence over bulk pricing</p>
            <p>• Units without individual prices use the default unit cost</p>
            <p>• You can apply bulk pricing to all units or clear individual pricing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}