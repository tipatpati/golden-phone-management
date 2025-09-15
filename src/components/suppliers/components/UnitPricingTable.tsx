import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Calculator, Edit3, Save, X, Euro } from 'lucide-react';
import type { UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';

interface UnitPricingTableProps {
  units: UnitEntryFormType[];
  defaultUnitCost: number;
  onUnitsChange: (units: UnitEntryFormType[]) => void;
  readOnly?: boolean;
}

export function UnitPricingTable({ 
  units, 
  defaultUnitCost, 
  onUnitsChange, 
  readOnly = false 
}: UnitPricingTableProps) {
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [tempPrices, setTempPrices] = useState<Record<string, string>>({});
  const [showAllPricing, setShowAllPricing] = useState(false);

  const unitsWithEffectivePricing = useMemo(() => {
    return units.map(unit => ({
      ...unit,
      effectivePrice: unit.price || defaultUnitCost,
      hasCustomPrice: Boolean(unit.price && unit.price > 0)
    }));
  }, [units, defaultUnitCost]);

  const pricingStats = useMemo(() => {
    const customPriced = unitsWithEffectivePricing.filter(u => u.hasCustomPrice);
    const total = unitsWithEffectivePricing.reduce((sum, u) => sum + u.effectivePrice, 0);
    const average = units.length > 0 ? total / units.length : 0;
    
    return {
      totalUnits: units.length,
      customPricedUnits: customPriced.length,
      totalValue: total,
      averagePrice: average,
      priceRange: {
        min: Math.min(...unitsWithEffectivePricing.map(u => u.effectivePrice)),
        max: Math.max(...unitsWithEffectivePricing.map(u => u.effectivePrice))
      }
    };
  }, [unitsWithEffectivePricing, units.length]);

  const handleStartEdit = (serial: string, currentPrice?: number) => {
    setEditingUnit(serial);
    setTempPrices({ [serial]: String(currentPrice || defaultUnitCost) });
  };

  const handleSaveEdit = (serial: string) => {
    const newPrice = parseFloat(tempPrices[serial] || '0');
    if (newPrice > 0) {
      const updatedUnits = units.map(unit => 
        unit.serial === serial 
          ? { ...unit, price: newPrice }
          : unit
      );
      onUnitsChange(updatedUnits);
    }
    setEditingUnit(null);
    setTempPrices({});
  };

  const handleCancelEdit = () => {
    setEditingUnit(null);
    setTempPrices({});
  };

  const handleRemoveCustomPrice = (serial: string) => {
    const updatedUnits = units.map(unit => 
      unit.serial === serial 
        ? { ...unit, price: undefined }
        : unit
    );
    onUnitsChange(updatedUnits);
  };

  const unitsToShow = showAllPricing 
    ? unitsWithEffectivePricing 
    : unitsWithEffectivePricing.filter(u => u.hasCustomPrice);

  if (units.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-center">
          <div className="space-y-2">
            <Calculator className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No units to price</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pricing Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Euro className="w-4 h-4" />
            Unit Pricing Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Units</p>
              <p className="text-lg font-bold">{pricingStats.totalUnits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Custom Priced</p>
              <p className="text-lg font-bold text-primary">
                {pricingStats.customPricedUnits}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Value</p>
              <p className="text-lg font-bold text-green-600">
                €{pricingStats.totalValue.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Average Price</p>
              <p className="text-lg font-bold">
                €{pricingStats.averagePrice.toFixed(2)}
              </p>
            </div>
          </div>
          
          {pricingStats.customPricedUnits > 0 && (
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Show all units</Label>
                <Switch
                  checked={showAllPricing}
                  onCheckedChange={setShowAllPricing}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unit Pricing Table */}
      {(showAllPricing || pricingStats.customPricedUnits > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {showAllPricing ? 'All Units' : 'Custom Priced Units'}
              <Badge variant="secondary" className="ml-2">
                {unitsToShow.length} units
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial/IMEI</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Price (€)</TableHead>
                  <TableHead>Source</TableHead>
                  {!readOnly && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitsToShow.map((unit) => (
                  <TableRow key={unit.serial}>
                    <TableCell className="font-medium">
                      {unit.serial}
                    </TableCell>
                    <TableCell>
                      {unit.storage ? `${unit.storage}GB` : '-'}
                    </TableCell>
                    <TableCell>
                      {unit.color || '-'}
                    </TableCell>
                    <TableCell>
                      {editingUnit === unit.serial ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={tempPrices[unit.serial] || ''}
                          onChange={(e) => setTempPrices({ 
                            ...tempPrices, 
                            [unit.serial]: e.target.value 
                          })}
                          className="w-20"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            €{unit.effectivePrice.toFixed(2)}
                          </span>
                          {unit.hasCustomPrice && (
                            <Badge variant="outline" className="text-xs">
                              Custom
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.hasCustomPrice ? 'default' : 'secondary'}>
                        {unit.hasCustomPrice ? 'Individual' : 'Default'}
                      </Badge>
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        {editingUnit === unit.serial ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveEdit(unit.serial)}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(unit.serial, unit.price)}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            {unit.hasCustomPrice && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveCustomPrice(unit.serial)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}