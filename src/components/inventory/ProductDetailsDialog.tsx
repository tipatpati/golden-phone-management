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
import { 
  Package, 
  AlertTriangle, 
  Barcode, 
  Tag, 
  Calendar,
  DollarSign,
  Edit,
  Printer,
  Euro
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductUnitsService, ProductUnit } from "@/services/products/productUnitsService";
import { UnitPricingDialog } from "./UnitPricingDialog";

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
        const units = await ProductUnitsService.getUnitsForProduct(product.id);
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
      ProductUnitsService.getUnitsForProduct(product.id)
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

        <div className="space-y-6">
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

          {/* Serial Numbers */}
          {product.has_serial && product.serial_numbers && product.serial_numbers.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Serial Numbers ({product.serial_numbers.length} units)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {product.serial_numbers.map((serial, index) => {
                    const parsed = parseSerialString(serial);
                    const unit = productUnits.find(u => u.serial_number === parsed.serial);
                    
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded text-sm border"
                      >
                        <div className="flex-1">
                          <div className="font-mono font-medium">{parsed.serial}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {parsed.color && <span className="mr-3">Color: {parsed.color}</span>}
                            {parsed.storage && <span className="mr-3">{parsed.storage}GB</span>}
                            {parsed.batteryLevel !== undefined && <span className="mr-3">Battery: {parsed.batteryLevel}%</span>}
                            {unit?.status && (
                              <Badge 
                                variant={unit.status === 'available' ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {unit.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            {unit?.price && (
                              <div className="text-sm font-medium">{formatCurrency(unit.price)}</div>
                            )}
                            {unit?.min_price && unit?.max_price && (
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(unit.min_price)} - {formatCurrency(unit.max_price)}
                              </div>
                            )}
                            {!unit?.price && !unit?.min_price && (
                              <div className="text-xs text-muted-foreground">No pricing set</div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUnit(unit || null);
                              setUnitPricingOpen(true);
                            }}
                            disabled={isLoadingUnits}
                          >
                            <Euro className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
        </div>
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