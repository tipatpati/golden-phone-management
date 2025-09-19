import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package, CheckSquare, Square } from "lucide-react";
import type { ThermalLabelData } from "@/services/labels/types";

interface ProductUnit {
  id: string;
  serial_number: string;
  barcode?: string;
  price?: number;
  storage?: number;
  ram?: number;
  color?: string;
  battery_level?: number;
}

interface SupplierProduct {
  id: string;
  brand: string;
  model: string;
  price: number;
  category?: { name: string };
  units?: ProductUnit[];
}

interface SupplierProductUnitSelectorProps {
  products: SupplierProduct[];
  onSelectionChange: (selectedLabels: ThermalLabelData[]) => void;
}

export function SupplierProductUnitSelector({
  products,
  onSelectionChange
}: SupplierProductUnitSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());

  // Parse and prepare all units with product context
  const allUnits = useMemo(() => {
    const units: Array<{
      unit: ProductUnit;
      product: SupplierProduct;
      displayName: string;
    }> = [];

    products.forEach(product => {
      if (product.units && product.units.length > 0) {
        product.units.forEach(unit => {
          units.push({
            unit,
            product,
            displayName: `${product.brand} ${product.model}`
          });
        });
      }
    });

    return units;
  }, [products]);

  // Filter units based on search term
  const filteredUnits = useMemo(() => {
    if (!searchTerm) return allUnits;
    
    const lowerSearch = searchTerm.toLowerCase();
    return allUnits.filter(({ unit, product }) => 
      unit.serial_number?.toLowerCase().includes(lowerSearch) ||
      product.brand.toLowerCase().includes(lowerSearch) ||
      product.model.toLowerCase().includes(lowerSearch) ||
      unit.color?.toLowerCase().includes(lowerSearch) ||
      unit.storage?.toString().includes(lowerSearch) ||
      unit.ram?.toString().includes(lowerSearch)
    );
  }, [allUnits, searchTerm]);

  // Generate selected thermal label data
  const generateSelectedLabels = (selectedUnitIds: Set<string>) => {
    const labels: ThermalLabelData[] = [];
    
    allUnits.forEach(({ unit, product }) => {
      if (selectedUnitIds.has(unit.id)) {
        labels.push({
          productName: `${product.brand} ${product.model}`,
          price: unit.price || product.price,
          barcode: unit.barcode || '',
          serialNumber: unit.serial_number,
          color: unit.color,
          storage: unit.storage,
          ram: unit.ram,
          batteryLevel: unit.battery_level
        });
      }
    });
    
    return labels;
  };

  // Handle unit selection toggle
  const handleUnitToggle = (unitId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedUnits);
    if (isSelected) {
      newSelected.add(unitId);
    } else {
      newSelected.delete(unitId);
    }
    setSelectedUnits(newSelected);
    onSelectionChange(generateSelectedLabels(newSelected));
  };

  // Handle select all for a product
  const handleProductSelectAll = (product: SupplierProduct) => {
    const productUnitIds = product.units?.map(unit => unit.id) || [];
    const newSelected = new Set(selectedUnits);
    
    productUnitIds.forEach(unitId => {
      newSelected.add(unitId);
    });
    
    setSelectedUnits(newSelected);
    onSelectionChange(generateSelectedLabels(newSelected));
  };

  // Handle deselect all for a product
  const handleProductSelectNone = (product: SupplierProduct) => {
    const productUnitIds = product.units?.map(unit => unit.id) || [];
    const newSelected = new Set(selectedUnits);
    
    productUnitIds.forEach(unitId => {
      newSelected.delete(unitId);
    });
    
    setSelectedUnits(newSelected);
    onSelectionChange(generateSelectedLabels(newSelected));
  };

  // Handle global select all
  const handleSelectAll = () => {
    const allUnitIds = new Set(allUnits.map(({ unit }) => unit.id));
    setSelectedUnits(allUnitIds);
    onSelectionChange(generateSelectedLabels(allUnitIds));
  };

  // Handle global select none
  const handleSelectNone = () => {
    setSelectedUnits(new Set());
    onSelectionChange([]);
  };

  // Group filtered units by product
  const unitsByProduct = useMemo(() => {
    const grouped = new Map<string, Array<typeof filteredUnits[0]>>();
    
    filteredUnits.forEach(item => {
      const productKey = `${item.product.brand}-${item.product.model}`;
      if (!grouped.has(productKey)) {
        grouped.set(productKey, []);
      }
      grouped.get(productKey)?.push(item);
    });
    
    return grouped;
  }, [filteredUnits]);

  const totalUnits = allUnits.length;
  const selectedCount = selectedUnits.size;
  const totalProducts = products.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h3 className="font-medium">Select Units to Print</h3>
          <Badge variant="secondary">
            {selectedCount} of {totalUnits} units selected
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedCount === totalUnits}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectNone}
            disabled={selectedCount === 0}
          >
            <Square className="h-4 w-4 mr-1" />
            None
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by serial, brand, model, color..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product Groups */}
      <ScrollArea className="h-96 border rounded-lg">
        <div className="p-4 space-y-4">
          {Array.from(unitsByProduct.entries()).map(([productKey, productUnits]) => {
            if (productUnits.length === 0) return null;
            
            const product = productUnits[0].product;
            const productUnitIds = productUnits.map(({ unit }) => unit.id);
            const selectedInProduct = productUnitIds.filter(id => selectedUnits.has(id)).length;
            const allSelected = selectedInProduct === productUnitIds.length;
            const someSelected = selectedInProduct > 0 && selectedInProduct < productUnitIds.length;

            return (
              <div key={productKey} className="space-y-2">
                {/* Product Header */}
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{productUnits[0].displayName}</h4>
                    <Badge variant="outline">
                      {selectedInProduct}/{productUnits.length} selected
                    </Badge>
                    {product.category && (
                      <Badge variant="secondary">{product.category.name}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProductSelectAll(product)}
                      disabled={allSelected}
                    >
                      All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleProductSelectNone(product)}
                      disabled={selectedInProduct === 0}
                    >
                      None
                    </Button>
                  </div>
                </div>

                {/* Product Units */}
                <div className="space-y-1 pl-4">
                  {productUnits.map(({ unit }) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between p-2 rounded border hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedUnits.has(unit.id)}
                          onCheckedChange={(checked) => 
                            handleUnitToggle(unit.id, checked === true)
                          }
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{unit.serial_number}</span>
                            {unit.barcode && (
                              <Badge variant="outline" className="text-xs">
                                {unit.barcode}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            {unit.color && <span>Color: {unit.color}</span>}
                            {unit.storage && <span>Storage: {unit.storage}GB</span>}
                            {unit.ram && <span>RAM: {unit.ram}GB</span>}
                            {unit.battery_level && <span>Battery: {unit.battery_level}%</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        €{unit.price || product.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Selected Summary */}
      {selectedCount > 0 && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedCount} unit{selectedCount !== 1 ? 's' : ''} selected for printing
            </span>
            <Badge>{selectedCount} labels</Badge>
          </div>
        </div>
      )}
    </div>
  );
}