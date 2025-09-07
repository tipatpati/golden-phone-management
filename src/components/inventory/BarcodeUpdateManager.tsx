import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { Code128GeneratorService } from "@/services/barcodes";
import { ProductUnitsService } from "@/services/inventory/ProductUnitsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UnitBarcodeData {
  id: string;
  serial_number: string;
  barcode?: string;
  color?: string;
  battery_level?: number;
}

interface BarcodeUpdateManagerProps {
  productId: string;
  productName: string;
  hasSerial: boolean;
  currentBarcode?: string;
  onBarcodeUpdate?: (newBarcode: string) => void;
}

export function BarcodeUpdateManager({
  productId,
  productName,
  hasSerial,
  currentBarcode,
  onBarcodeUpdate
}: BarcodeUpdateManagerProps) {
  const [units, setUnits] = useState<UnitBarcodeData[]>([]);
  const [productBarcode, setProductBarcode] = useState(currentBarcode || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Load units for products with serial numbers
  React.useEffect(() => {
    if (hasSerial) {
      loadUnits();
    }
  }, [hasSerial, productId]);

  const loadUnits = async () => {
    setIsLoadingUnits(true);
    try {
      const { data, error } = await supabase
        .from('product_units')
        .select('id, serial_number, barcode, color, battery_level')
        .eq('product_id', productId)
        .order('created_at');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Failed to load units:', error);
      toast.error('Failed to load product units');
    } finally {
      setIsLoadingUnits(false);
    }
  };

  const updateProductBarcode = async () => {
    if (!productBarcode.trim()) {
      toast.error('Please enter a barcode');
      return;
    }

    setIsLoading(true);
    try {
      // Validate barcode format
      const validation = Code128GeneratorService.validateCode128(productBarcode);
      if (!validation.isValid) {
        toast.error('Invalid barcode format: ' + validation.errors.join(', '));
        return;
      }

      // Update product barcode
      const { error } = await supabase
        .from('products')
        .update({ barcode: productBarcode })
        .eq('id', productId);

      if (error) throw error;

      toast.success('Product barcode updated successfully');
      onBarcodeUpdate?.(productBarcode);
    } catch (error) {
      console.error('Failed to update product barcode:', error);
      toast.error('Failed to update barcode');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUnitBarcode = async (unitId: string, newBarcode: string) => {
    if (!newBarcode.trim()) {
      toast.error('Please enter a barcode');
      return;
    }

    setIsLoading(true);
    try {
      // Validate barcode format
      const validation = Code128GeneratorService.validateCode128(newBarcode);
      if (!validation.isValid) {
        toast.error('Invalid barcode format: ' + validation.errors.join(', '));
        return;
      }

      // Update unit barcode
      const { error } = await supabase
        .from('product_units')
        .update({ barcode: newBarcode })
        .eq('id', unitId);

      if (error) throw error;

      // Update local state
      setUnits(prev => prev.map(unit => 
        unit.id === unitId ? { ...unit, barcode: newBarcode } : unit
      ));

      toast.success('Unit barcode updated successfully');
    } catch (error) {
      console.error('Failed to update unit barcode:', error);
      toast.error('Failed to update unit barcode');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateUnitBarcode = async (unitId: string) => {
    setIsLoading(true);
    try {
      // Generate new barcode using the barcode service
      const newBarcode = await Code128GeneratorService.generateUnitBarcode(unitId);
      
      // Update unit barcode
      const { error } = await supabase
        .from('product_units')
        .update({ barcode: newBarcode })
        .eq('id', unitId);

      if (error) throw error;

      // Update local state
      setUnits(prev => prev.map(unit => 
        unit.id === unitId ? { ...unit, barcode: newBarcode } : unit
      ));

      toast.success('Unit barcode regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate unit barcode:', error);
      toast.error('Failed to regenerate barcode');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasSerial) {
    // Product-level barcode management for bulk products
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Update Product Barcode</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update the barcode for {productName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-barcode">Product Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="product-barcode"
                value={productBarcode}
                onChange={(e) => setProductBarcode(e.target.value)}
                placeholder="Enter new barcode"
                className="flex-1"
              />
              <Button 
                onClick={updateProductBarcode}
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>

          {productBarcode && (
            <div className="border rounded p-4 bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Barcode Preview</h4>
              <BarcodeGenerator 
                value={productBarcode}
                displayValue={true}
                format="CODE128"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Unit-level barcode management for products with serials
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Update Unit Barcodes</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage barcodes for each unit of {productName}
        </p>
      </CardHeader>
      <CardContent>
        {isLoadingUnits ? (
          <div className="text-center py-4">Loading units...</div>
        ) : units.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No units found for this product
          </div>
        ) : (
          <div className="space-y-4">
            {units.map((unit) => (
              <UnitBarcodeEditor
                key={unit.id}
                unit={unit}
                onUpdate={(newBarcode) => updateUnitBarcode(unit.id, newBarcode)}
                onRegenerate={() => regenerateUnitBarcode(unit.id)}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface UnitBarcodeEditorProps {
  unit: UnitBarcodeData;
  onUpdate: (newBarcode: string) => void;
  onRegenerate: () => void;
  isLoading: boolean;
}

function UnitBarcodeEditor({ unit, onUpdate, onRegenerate, isLoading }: UnitBarcodeEditorProps) {
  const [barcode, setBarcode] = useState(unit.barcode || '');

  return (
    <div className="border rounded p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">SN: {unit.serial_number}</h4>
          {(unit.color || unit.battery_level) && (
            <p className="text-xs text-muted-foreground">
              {unit.color && `Color: ${unit.color}`}
              {unit.color && unit.battery_level && ' | '}
              {unit.battery_level && `Battery: ${unit.battery_level}%`}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onRegenerate}
          disabled={isLoading}
        >
          Regenerate
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`barcode-${unit.id}`}>Barcode</Label>
        <div className="flex gap-2">
          <Input
            id={`barcode-${unit.id}`}
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter barcode"
            className="flex-1"
          />
          <Button 
            size="sm"
            onClick={() => onUpdate(barcode)}
            disabled={isLoading || !barcode.trim()}
          >
            Update
          </Button>
        </div>
      </div>

      {unit.barcode && (
        <div className="bg-gray-50 rounded p-2">
          <BarcodeGenerator 
            value={unit.barcode}
            displayValue={true}
            format="CODE128"
            width={1.5}
            height={40}
          />
        </div>
      )}
    </div>
  );
}