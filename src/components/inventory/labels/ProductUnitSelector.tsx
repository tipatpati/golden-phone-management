import React, { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Search, Battery, Palette } from "lucide-react";
import { formatProductUnitName } from "@/utils/productNaming";
import { ThermalLabelData } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ProductUnitSelectorProps {
  serialNumbers: string[];
  onSelectionChange: (selectedLabels: ThermalLabelData[]) => void;
  productName: string;
  productPrice: number;
  productBarcode?: string;
  productCategory?: string;
  productId?: string; // Add productId to fetch real unit data
}

export function ProductUnitSelector({
  serialNumbers,
  onSelectionChange,
  productName,
  productPrice,
  productBarcode,
  productCategory,
  productId
}: ProductUnitSelectorProps) {
  const [selectedUnits, setSelectedUnits] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [realLabels, setRealLabels] = useState<ThermalLabelData[]>([]);

  // Fetch existing units with their barcodes directly
  useEffect(() => {
    const fetchExistingUnits = async () => {
      if (!productId) {
        console.warn('No productId provided for ProductUnitSelector');
        return;
      }

      console.log('🔧 ProductUnitSelector: Fetching existing units for product:', productId);
      
      try {
        // Directly fetch existing units from database - no backfill needed
        const { data: units, error } = await supabase
          .from('product_units')
          .select('*')
          .eq('product_id', productId);

        if (error) {
          throw new Error(`Failed to fetch units: ${error.message}`);
        }

        if (!units || units.length === 0) {
          console.log('⚠️ No units found for product:', productId);
          setRealLabels([]);
          return;
        }

        // Convert units to thermal label data format
        const labels: ThermalLabelData[] = units.map(unit => ({
          serialNumber: unit.serial_number,
          barcode: unit.barcode || '', // Use existing barcode from DB
          productName: productName,
          price: unit.price || productPrice,
          color: unit.color,
          storage: unit.storage,
          ram: unit.ram,
          batteryLevel: unit.battery_level,
          category: productCategory
        })).filter(label => label.barcode); // Only include units with barcodes
        
        console.log('✅ ProductUnitSelector: Got existing labels:', labels.length);
        console.log('🔍 Existing barcodes:', labels.map(l => ({ serial: l.serialNumber, barcode: l.barcode })));
        
        setRealLabels(labels);
      } catch (error) {
        console.error('❌ ProductUnitSelector: Failed to fetch existing units:', error);
        setRealLabels([]);
      }
    };

    fetchExistingUnits();
  }, [productId, productName, productPrice, productCategory]);

  // Parse and filter units using real thermal label data
  const parsedUnits = useMemo(() => {
    return serialNumbers.map((serialNumber, index) => {
      const serial = serialNumber.trim();
      
      // Find matching real label for this serial
      const realLabel = realLabels.find(label => label.serialNumber === serial);
      
      return {
        id: index,
        serial,
        color: realLabel?.color,
        storage: realLabel?.storage,
        ram: realLabel?.ram,
        batteryLevel: realLabel?.batteryLevel,
        name: realLabel?.productName || `${productName} #${index + 1}`,
        price: realLabel?.price || productPrice || 0,
        barcode: realLabel?.barcode, // Use REAL barcode from database
        category: realLabel?.category || productCategory,
        realLabel // Store the full real label
      };
    }).filter(unit => 
      searchTerm === "" || 
      unit.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.color?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [serialNumbers, searchTerm, realLabels, productName, productPrice, productCategory]);

  // Generate thermal labels from selected units using REAL data
  const generateSelectedLabels = (selectedIndices: Set<number>): ThermalLabelData[] => {
    return Array.from(selectedIndices).map(index => {
      const unit = parsedUnits.find(u => u.id === index);
      if (!unit || !unit.realLabel) {
        console.warn('No real label data for unit:', unit?.serial);
        return null;
      }

      // Return the actual real label instead of reconstructing it
      return unit.realLabel;
    }).filter(Boolean) as ThermalLabelData[];
  };

  const handleUnitToggle = (index: number) => {
    const newSelected = new Set(selectedUnits);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedUnits(newSelected);
    onSelectionChange(generateSelectedLabels(newSelected));
  };

  const handleSelectAll = () => {
    const allIndices = new Set(parsedUnits.map(unit => unit.id));
    setSelectedUnits(allIndices);
    onSelectionChange(generateSelectedLabels(allIndices));
  };

  const handleSelectNone = () => {
    setSelectedUnits(new Set());
    onSelectionChange([]);
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return "bg-gray-100 text-gray-800";
    if (level >= 80) return "bg-green-100 text-green-800";
    if (level >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Select Units to Print ({selectedUnits.size}/{parsedUnits.length})</Label>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            disabled={selectedUnits.size === parsedUnits.length}
          >
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectNone}
            disabled={selectedUnits.size === 0}
          >
            Select None
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by serial number or color..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Unit List */}
      <ScrollArea className="h-64 border rounded-md">
        <div className="p-4 space-y-2">
          {parsedUnits.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? "No units match your search" : "No units available"}
            </div>
          ) : (
            parsedUnits.map((unit) => (
              <div
                key={unit.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedUnits.has(unit.id)
                    ? "bg-primary/5 border-primary/20" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleUnitToggle(unit.id)}
              >
                <Checkbox
                  id={`unit-${unit.id}`}
                  checked={selectedUnits.has(unit.id)}
                  onCheckedChange={() => handleUnitToggle(unit.id)}
                />
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{unit.serial}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {unit.color && (
                      <Badge variant="outline" className="text-xs">
                        <Palette className="h-3 w-3 mr-1" />
                        {unit.color}
                      </Badge>
                    )}
                    
                    {unit.storage && (
                      <Badge variant="outline" className="text-xs">
                        {unit.storage}GB
                      </Badge>
                    )}
                    
                    {unit.ram && (
                      <Badge variant="outline" className="text-xs">
                        {unit.ram}GB RAM
                      </Badge>
                    )}
                    
                    {unit.batteryLevel && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getBatteryColor(unit.batteryLevel)}`}
                      >
                        <Battery className="h-3 w-3 mr-1" />
                        {unit.batteryLevel}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {selectedUnits.size > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          {selectedUnits.size} unit{selectedUnits.size !== 1 ? 's' : ''} selected for printing
        </div>
      )}
    </div>
  );
}