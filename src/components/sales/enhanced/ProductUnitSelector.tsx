import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Smartphone, Battery, Palette, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, ProductUnit } from "@/services/inventory/types";
import type { CreateSaleData } from "@/services/sales/types";

interface SaleItemWithUnit {
  product_id: string;
  product_unit_id?: string;
  serial_number?: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  storage?: number;
  ram?: number;
}

interface ProductUnitSelectorProps {
  product: Product;
  onUnitSelect: (saleItem: SaleItemWithUnit) => void;
  onCancel: () => void;
}

export const ProductUnitSelector: React.FC<ProductUnitSelectorProps> = ({
  product,
  onUnitSelect,
  onCancel
}) => {
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole } = useAuth();

  // Filter available units based on search term
  const availableUnits = (product.product_units || [])
    .filter(unit => unit.status === 'available')
    .filter(unit => 
      !searchTerm || 
      unit.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.serial_number.slice(-4).includes(searchTerm)
    );

  // Set default price when unit is selected
  React.useEffect(() => {
    if (selectedUnit) {
      // For salespersons, always use max selling price by default
      const defaultPrice = userRole === 'salesperson' 
        ? (selectedUnit.max_price || product.max_price || product.price || 0)
        : (selectedUnit.max_price || product.max_price || product.price || 0);
      setCustomPrice(defaultPrice.toString());
    }
  }, [selectedUnit, product, userRole]);

  const handleUnitSelect = (unit: ProductUnit) => {
    setSelectedUnit(unit);
  };

  const handleConfirmSelection = () => {
    if (!selectedUnit) {
      toast.error("Seleziona un'unità da vendere");
      return;
    }

    const price = parseFloat(customPrice);
    const minPrice = selectedUnit.min_price || product.min_price || 0;
    const maxPrice = selectedUnit.max_price || product.max_price || product.price || 0;

    if (isNaN(price) || price <= 0) {
      toast.error("Inserisci un prezzo valido");
      return;
    }

    if (price < minPrice) {
      toast.error(`Il prezzo non può essere inferiore a €${minPrice}`);
      return;
    }

    if (price > maxPrice) {
      toast.error(`Il prezzo non può essere superiore a €${maxPrice}`);
      return;
    }

    const saleItem: SaleItemWithUnit = {
      product_id: product.id,
      product_unit_id: selectedUnit.id,
      serial_number: selectedUnit.serial_number,
      barcode: selectedUnit.barcode,
      quantity: 1,
      unit_price: price,
      brand: product.brand,
      model: product.model,
      year: product.year,
      color: selectedUnit.color,
      storage: selectedUnit.storage,
      ram: selectedUnit.ram
    };

    onUnitSelect(saleItem);
    toast.success(`${product.brand} ${product.model} aggiunto alla garentille`);
  };

  const getStorageDisplay = (storage?: number) => {
    if (!storage) return null;
    return storage >= 1000 ? `${storage / 1000}TB` : `${storage}GB`;
  };

  const getRamDisplay = (ram?: number) => {
    if (!ram) return null;
    return `${ram}GB RAM`;
  };

  if (availableUnits.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-semibold">Nessuna unità disponibile</h3>
            <p className="text-muted-foreground">
              Non ci sono unità disponibili per {product.brand} {product.model}
            </p>
            <Button variant="outline" onClick={onCancel}>
              Torna alla ricerca
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">
              Seleziona unità da vendere
            </h3>
            <p className="text-muted-foreground">
              {product.brand} {product.model} {product.year && `(${product.year})`}
            </p>
          </div>

          {/* Search units */}
          {availableUnits.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per IMEI/Serial o ultime 4 cifre..."
                className="pl-10"
              />
            </div>
          )}

          {/* Available units */}
          <div className="grid gap-3 max-h-60 overflow-y-auto">
            {availableUnits.map((unit) => (
              <div
                key={unit.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedUnit?.id === unit.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => handleUnitSelect(unit)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm font-medium">
                        {unit.serial_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {unit.color && (
                        <div className="flex items-center space-x-1">
                          <Palette className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">
                            {unit.color}
                          </Badge>
                        </div>
                      )}
                      
                      {unit.storage && (
                        <Badge variant="outline" className="text-xs">
                          {getStorageDisplay(unit.storage)}
                        </Badge>
                      )}
                      
                      {unit.ram && (
                        <Badge variant="outline" className="text-xs">
                          {getRamDisplay(unit.ram)}
                        </Badge>
                      )}
                    </div>

                    {unit.battery_level && (
                      <div className="flex items-center space-x-1">
                        <Battery className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {unit.battery_level}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      {/* For salespersons, only show max selling price */}
                      {userRole === 'salesperson' ? (
                        <div className="font-semibold">
                          €{unit.max_price || product.max_price || product.price || 0}
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold">
                            €{unit.max_price || product.max_price || product.price || 0}
                          </div>
                          {(unit.min_price || product.min_price) && (
                            <div className="text-xs text-muted-foreground">
                              da €{unit.min_price || product.min_price}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {selectedUnit?.id === unit.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price configuration */}
          {selectedUnit && (
            <div className="border-t pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prezzo di garentille</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="0.00"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {/* For salespersons, only show max price */}
                    {userRole === 'salesperson' 
                      ? `Prezzo: €${selectedUnit.max_price || product.max_price || product.price || 0}`
                      : `Range: €${selectedUnit.min_price || product.min_price || 0} - €${selectedUnit.max_price || product.max_price || product.price || 0}`
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Unità selezionata</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="font-mono text-sm">
                      {selectedUnit.serial_number}
                    </div>
                    {selectedUnit.color && (
                      <div className="text-xs text-muted-foreground">
                        {selectedUnit.color}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 border-t pt-6">
            <Button variant="outline" onClick={onCancel}>
              Annulla
            </Button>
            <Button 
              onClick={handleConfirmSelection}
              disabled={!selectedUnit || !customPrice}
            >
              Aggiungi alla garentille
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};