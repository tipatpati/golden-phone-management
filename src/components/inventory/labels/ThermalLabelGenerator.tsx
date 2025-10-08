import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Printer, Eye, History, AlertCircle, Wrench } from "lucide-react";
import { ThermalLabelPreview } from "./ThermalLabelPreview";
import { ProductUnitSelector } from "./ProductUnitSelector";
import { SupplierProductUnitSelector } from "@/components/suppliers/forms/SupplierProductUnitSelector";
import { BarcodeFixTool } from "@/components/inventory/admin/BarcodeFixTool";
import { useThermalLabelPrint } from "./hooks/useThermalLabelPrint";
import { ThermalLabelData, ThermalLabelOptions } from "./types";

interface ThermalLabelGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels?: ThermalLabelData[];
  companyName?: string;
  productSerialNumbers?: string[];
  productName?: string;
  productPrice?: number;
  productMaxPrice?: number;
  productMinPrice?: number;
  productBarcode?: string;
  productCategory?: string;
  productId?: string;
  allowUnitSelection?: boolean;
  isSupplierLabel?: boolean;
  // New unified interface props
  labelSource?: 'inventory' | 'supplier';
  dataProvider?: {
    labels: ThermalLabelData[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => void;
  };
}

export function ThermalLabelGenerator({
  open,
  onOpenChange,
  labels = [],
  companyName = "GOLDEN PHONE SRL",
  productSerialNumbers = [],
  productName = "",
  productPrice = 0,
  productMaxPrice,
  productMinPrice,
  productBarcode = "",
  productCategory = "",
  productId,
  allowUnitSelection = false,
  isSupplierLabel = false,
  labelSource = 'inventory',
  dataProvider
}: ThermalLabelGeneratorProps) {
  const [options, setOptions] = useState<ThermalLabelOptions>({
    copies: 1,
    includePrice: true,
    includeBarcode: true,
    includeCompany: true,
    includeCategory: true,
    format: "standard",
    useMasterBarcode: false
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showBarcodeFixTool, setShowBarcodeFixTool] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<ThermalLabelData[]>([]);
  
  // Determine the source of labels
  const activeLabels = dataProvider?.labels || labels;
  const isLoading = dataProvider?.isLoading || false;
  const error = dataProvider?.error || null;

  // Update selected labels when props change OR generate default labels for bulk products
  React.useEffect(() => {
    if (!allowUnitSelection) {
      if (activeLabels.length > 0) {
        setSelectedLabels(activeLabels);
      } else if (productName && productPrice >= 0) {
        // Generate default labels for bulk products (products without serial numbers)
        const defaultLabels: ThermalLabelData[] = Array(1).fill(null).map((_, index) => ({
          productName,
          barcode: productBarcode || '', 
          price: productPrice,
          maxPrice: productMaxPrice,
          category: productCategory,
          serialNumber: undefined, // No serial for bulk products
          batteryLevel: undefined,
          color: undefined,
          storage: undefined,
          ram: undefined
        }));
        setSelectedLabels(defaultLabels);
        console.log('🏷️ Generated default thermal labels for bulk product:', productName);
      }
    } else if (labelSource === 'inventory' && activeLabels.length > 0) {
      // Auto-select all inventory labels even in unit selection mode
      setSelectedLabels(activeLabels);
    }
  }, [activeLabels, allowUnitSelection, labelSource, productName, productPrice, productBarcode, productMaxPrice, productCategory]);

  const { printState, printLabels } = useThermalLabelPrint();

  // Use selected labels for calculations
  const currentLabels = allowUnitSelection ? selectedLabels : activeLabels;
  
  // Memoized calculations for performance
  const labelStats = useMemo(() => {
    const totalLabels = currentLabels.length * options.copies;
    const uniqueProducts = new Set(currentLabels.map(l => l.productName)).size;
    const hasSerialNumbers = currentLabels.some(l => l.serialNumber);
    const hasBatteryLevels = currentLabels.some(l => l.batteryLevel);
    
    return {
      totalLabels,
      uniqueProducts,
      hasSerialNumbers,
      hasBatteryLevels
    };
  }, [currentLabels, options.copies]);

  const handlePrint = async () => {
    await printLabels(currentLabels, { ...options, companyName, isSupplierLabel });
    // Close dialog after print attempt
    setTimeout(() => onOpenChange(false), 1000);
      // Close dialog after successful print
  };

  // Helper function to extract supplier products from labels for unit selection
  const extractSupplierProductsFromLabels = (labels: ThermalLabelData[]) => {
    const productMap = new Map();
    
    labels.forEach(label => {
      if (!label.serialNumber) return; // Skip labels without serial numbers
      
      // Use productName as key to group by actual product
      const productKey = label.productName;
      
      if (!productMap.has(productKey)) {
        const nameParts = label.productName.split(' ');
        productMap.set(productKey, {
          id: productKey,
          brand: nameParts[0] || 'Unknown',
          model: nameParts.slice(1).join(' ') || 'Unknown',
          price: label.price || 0,
          units: []
        });
      }
      
      const product = productMap.get(productKey);
      product.units.push({
        id: label.id,
        serial_number: label.serialNumber,
        barcode: label.barcode,
        price: label.price,
        storage: label.storage,
        ram: label.ram,
        color: label.color,
        battery_level: label.batteryLevel
      });
    });
    
    return Array.from(productMap.values());
  };

  const updateOption = <K extends keyof ThermalLabelOptions>(
    key: K,
    value: ThermalLabelOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  // Only show error dialog if we truly have no data to work with
  if (currentLabels.length === 0 && !allowUnitSelection && (!productName || productPrice < 0)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              No Labels Available
            </DialogTitle>
            <DialogDescription>
              Please select products with valid data to generate thermal labels. 
              Ensure products have names, prices, and barcodes.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  console.log('🎨 ThermalLabelGenerator rendering', {
    open,
    activeLabelsCount: activeLabels.length,
    selectedLabelsCount: selectedLabels.length,
    isLoading,
    error,
    labelSource
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            {labelSource === 'supplier' ? 'Supplier' : 'Professional'} Thermal Label Generator
          </DialogTitle>
          <DialogDescription>
            6cm × 3cm landscape format at 96 DPI for professional thermal printers
          </DialogDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">
              {labelStats.totalLabels} total labels
            </Badge>
            <Badge variant="outline">
              {labelStats.uniqueProducts} product{labelStats.uniqueProducts !== 1 ? 's' : ''}
            </Badge>
            {labelStats.hasSerialNumbers && (
              <Badge variant="outline">Serial numbers</Badge>
            )}
            {labelStats.hasBatteryLevels && (
              <Badge variant="outline">Battery levels</Badge>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6">
          {/* Unit Selection Panel (if enabled) */}
          {allowUnitSelection && labelSource === 'supplier' && activeLabels.length > 0 && (
            <SupplierProductUnitSelector
              products={extractSupplierProductsFromLabels(activeLabels)}
              onSelectionChange={setSelectedLabels}
            />
          )}
          
          {allowUnitSelection && labelSource === 'inventory' && productSerialNumbers.length > 0 && (
            <ProductUnitSelector
              serialNumbers={productSerialNumbers}
              onSelectionChange={setSelectedLabels}
              productName={productName}
              productPrice={productPrice}
              productMaxPrice={productMaxPrice}
              productMinPrice={productMinPrice}
              productBarcode={productBarcode}
              productCategory={productCategory}
              productId={productId} // Pass productId for real data fetching
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="copies">Copies per unit</Label>
                <Input
                  id="copies"
                  type="number"
                  min="1"
                  max="10"
                  value={options.copies}
                  onChange={(e) => updateOption('copies', parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label>Label format</Label>
                <Select 
                  value={options.format} 
                  onValueChange={(value: "standard" | "compact") => updateOption('format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Include information</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-company"
                    checked={options.includeCompany}
                    onCheckedChange={(checked) => updateOption('includeCompany', checked === true)}
                  />
                  <Label htmlFor="include-company" className="text-sm">
                    Company name
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-price"
                    checked={options.includePrice}
                    onCheckedChange={(checked) => updateOption('includePrice', checked === true)}
                  />
                  <Label htmlFor="include-price" className="text-sm">
                    Price
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-barcode"
                    checked={options.includeBarcode}
                    onCheckedChange={(checked) => updateOption('includeBarcode', checked === true)}
                  />
                  <Label htmlFor="include-barcode" className="text-sm">
                    Barcode
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-category"
                    checked={options.includeCategory}
                    onCheckedChange={(checked) => updateOption('includeCategory', checked === true)}
                  />
                  <Label htmlFor="include-category" className="text-sm">
                    Category
                  </Label>
                </div>
              </div>
              
              {/* Barcode Settings */}
              {options.includeBarcode && labelStats.hasSerialNumbers && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-sm font-medium">Barcode Options</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-master-barcode"
                      checked={options.useMasterBarcode || false}
                      onCheckedChange={(checked) => updateOption('useMasterBarcode', checked === true)}
                    />
                    <Label htmlFor="use-master-barcode" className="text-sm">
                      Use master product barcode (same for all units)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {options.useMasterBarcode 
                      ? "All labels will use the same product barcode"
                      : "Each unit will have a unique barcode based on its serial number"
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1"
                disabled={currentLabels.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBarcodeFixTool(!showBarcodeFixTool)}
                className="flex-1"
                disabled={printState.isPrinting}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Fix Barcodes
              </Button>
              <Button
                onClick={handlePrint}
                disabled={printState.isPrinting || currentLabels.length === 0}
                className="flex-1"
              >
                {printState.isPrinting ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Printer className="h-4 w-4 mr-2" />
                    Print {labelStats.totalLabels} Labels
                  </>
                )}
              </Button>
            </div>

            {/* Print History */}
            {printState.printHistory.length > 0 && (
              <div className="pt-4 border-t">
                <Label className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4" />
                  Recent Print Jobs
                </Label>
                <div className="mt-2 space-y-1">
                  {printState.printHistory.slice(0, 3).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {entry.labelCount} labels - {entry.timestamp.toLocaleTimeString()}
                      </span>
                      <Badge variant={entry.success ? "default" : "destructive"} className="text-xs">
                        {entry.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

            {/* Barcode Fix Tool */}
            {showBarcodeFixTool && (
              <div className="space-y-4">
                <BarcodeFixTool onFixed={() => {
                  // Optionally refresh data here
                  setShowBarcodeFixTool(false);
                }} />
              </div>
            )}

            {/* Preview Panel */}
            {showPreview && currentLabels.length > 0 && (
              <div className="space-y-4">
                <Label>Label Preview</Label>
                <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {currentLabels.map((label, index) => (
                      <div key={index}>
                        <ThermalLabelPreview
                          label={label}
                          options={{ ...options, companyName, isSupplierLabel }}
                        />
                        {currentLabels.length > 1 && (
                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            Unit {index + 1} of {currentLabels.length}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}