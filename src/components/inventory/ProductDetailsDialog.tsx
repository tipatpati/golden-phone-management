import React, { useState, useEffect } from "react";
import { formatProductName, parseSerialString, formatProductUnitDisplay } from "@/utils/productNaming";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  AlertTriangle, 
  Barcode, 
  Tag, 
  Calendar,
  DollarSign,
  Edit,
  Printer,
  Euro,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import type { ProductUnit } from "@/services/inventory/types";
import { UnitPricingDialog } from "./UnitPricingDialog";
import { ProductHistoryView } from "./ProductHistoryView";

interface Product {
  id: string;
  brand: string;
  model: string;
  year?: number;
  category?: { id: number; name: string };
  price?: number;      // Optional default price
  min_price?: number;  // Optional default min price
  max_price?: number;  // Optional default max price
  stock: number;
  threshold: number;
  description?: string;
  supplier?: string;
  barcode?: string;
  has_serial: boolean;
  serial_numbers?: string[];
}

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (product: Product) => void;
  onPrint?: (product: Product) => void;
}

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

export function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
  onEdit,
  onPrint
}: ProductDetailsDialogProps) {
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | null>(null);
  const [unitPricingOpen, setUnitPricingOpen] = useState(false);
  const [isLoadingUnits, setIsLoadingUnits] = useState(false);

  // Fetch product units when dialog opens
  useEffect(() => {
    const fetchUnits = async () => {
      if (!product || !open || !product.has_serial) return;
      
      setIsLoadingUnits(true);
      try {
        const units = await ProductUnitManagementService.getUnitsForProduct(product.id);
        setProductUnits(units);
      } catch (error) {
        console.error('Error fetching product units:', error);
      } finally {
        setIsLoadingUnits(false);
      }
    };

    fetchUnits();
  }, [product, open]);

  const handleUnitPricingSuccess = () => {
    // Refresh units after pricing update
    if (product) {
      ProductUnitManagementService.getUnitsForProduct(product.id)
        .then(setProductUnits)
        .catch(console.error);
    }
  };

  if (!product) return null;

  const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
  
  // Get storage info from first serial if available
  let storage;
  if (product.serial_numbers && product.serial_numbers.length > 0) {
    const parsed = parseSerialString(product.serial_numbers[0]);
    storage = parsed.storage;
  }
  
  const productName = formatProductName({ brand: cleanBrand, model: cleanModel, storage });

  const getCategoryBadgeColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'phones':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accessories':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tablets':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'laptops':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (stock <= threshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const stockStatus = getStockStatus(product.stock, product.threshold);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            Detailed information for {productName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Main Product Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{productName}</CardTitle>
                    {product.year && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {product.year}
                      </div>
                    )}
                    {product.category && (
                      <Badge variant="outline" className={getCategoryBadgeColor(product.category.name)}>
                        {product.category.name}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {product.price ? formatCurrency(product.price) : 'Unit-specific'}
                    </div>
                    <Badge variant="outline" className={stockStatus.color}>
                      {stockStatus.label}
                    </Badge>
                  </div>
                </div>
                {product.description && (
                  <CardDescription className="mt-2">
                    {product.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>

            {/* Stock & Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Stock Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Stock:</span>
                    <span className="font-medium">{product.stock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Threshold:</span>
                    <span className="font-medium">{product.threshold}</span>
                  </div>
                  {product.stock <= product.threshold && product.stock > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      <AlertTriangle className="h-3 w-3" />
                      Stock is below threshold
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Default Price:</span>
                    <span className="font-medium">
                      {product.price ? formatCurrency(product.price) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Default Min Price:</span>
                    <span className="font-medium">
                      {product.min_price ? formatCurrency(product.min_price) : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Default Max Price:</span>
                    <span className="font-medium">
                      {product.max_price ? formatCurrency(product.max_price) : 'Not set'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded">
                    💰 Pricing is now managed at the unit level. These are default values for new units.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.barcode && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Barcode:</span>
                    </div>
                    <span className="font-mono text-sm">{product.barcode}</span>
                  </div>
                )}
                
                {product.supplier && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Supplier:</span>
                    </div>
                    <span className="text-sm">{product.supplier}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Serial Tracking:</span>
                  <Badge variant={product.has_serial ? "default" : "secondary"}>
                    {product.has_serial ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Product Units - Enhanced Details */}
            {product.has_serial && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Product Units {productUnits.length > 0 && `(${productUnits.length} units)`}
                  </CardTitle>
                  {isLoadingUnits && (
                    <CardDescription>Loading unit details...</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {productUnits.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {productUnits.map((unit) => (
                        <div
                          key={unit.id}
                          className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
                        >
                          <div className="flex-1 space-y-2">
                            {/* Serial Number & Barcode */}
                            <div className="space-y-1">
                              <div className="font-mono font-semibold text-sm">{unit.serial_number}</div>
                              {unit.barcode && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Barcode className="h-3 w-3" />
                                  {unit.barcode}
                                </div>
                              )}
                            </div>
                            
                            {/* Unit Specifications */}
                            <div className="flex flex-wrap gap-3 text-xs">
                              {unit.color && (
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                                  {unit.color}
                                </span>
                              )}
                              {unit.storage && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {unit.storage}GB
                                </span>
                              )}
                              {unit.ram && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  {unit.ram}GB RAM
                                </span>
                              )}
                              {unit.battery_level !== null && unit.battery_level !== undefined && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Battery: {unit.battery_level}%
                                </span>
                              )}
                            </div>

                            {/* Additional Unit Info */}
                            <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                              <div>Unit ID: {unit.id}</div>
                              <div>Created: {new Date(unit.created_at || '').toLocaleDateString()}</div>
                              {unit.updated_at && (
                                <div>Updated: {new Date(unit.updated_at).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Status & Pricing */}
                          <div className="flex flex-col items-end gap-2">
                            <Badge 
                              variant={unit.status === 'available' ? 'default' : 
                                     unit.status === 'sold' ? 'destructive' :
                                     unit.status === 'reserved' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {unit.status}
                            </Badge>
                            
                            {/* Pricing Info */}
                            <div className="text-right space-y-1">
                              {unit.price && (
                                <div className="text-sm font-medium">
                                  Base: {formatCurrency(unit.price)}
                                </div>
                              )}
                              {unit.min_price && (
                                <div className="text-xs text-muted-foreground">
                                  Min: {formatCurrency(unit.min_price)}
                                </div>
                              )}
                              {unit.max_price && (
                                <div className="text-xs font-medium text-primary">
                                  Max: {formatCurrency(unit.max_price)}
                                </div>
                              )}
                              {!unit.price && !unit.min_price && !unit.max_price && (
                                <div className="text-xs text-muted-foreground">No pricing set</div>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUnit(unit);
                                setUnitPricingOpen(true);
                              }}
                              disabled={isLoadingUnits}
                              className="h-7 w-7 p-0"
                            >
                              <Euro className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : product.serial_numbers && product.serial_numbers.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground mb-3">
                        Found {product.serial_numbers.length} serial numbers but no detailed unit records:
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {product.serial_numbers.map((serial, index) => {
                          const parsed = parseSerialString(serial);
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-amber-50 rounded text-sm border border-amber-200"
                            >
                              <div className="flex-1">
                                <div className="font-mono font-medium">{parsed.serial}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {parsed.color && <span className="mr-3">Color: {parsed.color}</span>}
                                  {parsed.storage && <span className="mr-3">{parsed.storage}GB</span>}
                                  {parsed.batteryLevel !== undefined && <span className="mr-3">Battery: {parsed.batteryLevel}%</span>}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Legacy
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No units found for this product</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              {onPrint && (
                <Button variant="outline" onClick={() => onPrint(product)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Labels
                </Button>
              )}
              {onEdit && (
                <Button onClick={() => onEdit(product)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <ProductHistoryView 
              productId={product.id}
              productUnits={productUnits.map(u => ({ id: u.id, serial_number: u.serial_number }))}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Unit Pricing Dialog */}
      <UnitPricingDialog
        unit={selectedUnit}
        open={unitPricingOpen}
        onClose={() => {
          setUnitPricingOpen(false);
          setSelectedUnit(null);
        }}
        onSuccess={handleUnitPricingSuccess}
      />
    </Dialog>
  );
}