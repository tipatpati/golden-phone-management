import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/updated-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/updated-button";
import { 
  Package, 
  AlertTriangle, 
  Barcode, 
  Edit, 
  Trash2, 
  Printer,
  Euro,
  Info
} from "lucide-react";
import { formatProductName, parseSerialString } from "@/utils/productNaming";
import { getProductPricingInfoSync } from "@/utils/unitPricingUtils";
import { UnifiedInventoryLabels } from "./labels/UnifiedInventoryLabels";
import type { Product } from "@/services/inventory/types";

interface InventoryCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onViewDetails: (product: Product) => void;
}

export function InventoryCard({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails
}: InventoryCardProps) {
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

  const getStockStatus = (stock: number = 0, threshold: number = 0) => {
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (stock <= threshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
  
  let storage;
  if (product.serial_numbers && product.serial_numbers.length > 0) {
    const parsed = parseSerialString(product.serial_numbers[0]);
    storage = parsed.storage;
  }

  const productName = formatProductName({ 
    brand: cleanBrand, 
    model: cleanModel, 
    storage 
  });

  const stockStatus = getStockStatus(product.stock, product.threshold);
  const pricingInfo = getProductPricingInfoSync({
    price: product.price || 0,
    has_serial: product.has_serial,
    min_price: product.min_price,
    max_price: product.max_price
  });

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
        isSelected ? 'border-l-primary bg-primary/5' : 'border-l-primary/20 hover:border-l-primary'
      }`}
      onClick={() => onViewDetails(product)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base text-on-surface leading-tight">
                {productName}
              </h3>
              {product.year && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {product.year}
                </p>
              )}
              {product.barcode && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Barcode className="h-3 w-3" />
                  {product.barcode}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {product.category && (
              <Badge 
                variant="outline" 
                className={`text-xs font-semibold px-1.5 py-0.5 ${getCategoryBadgeColor(product.category.name)}`}
              >
                {product.category.name}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${stockStatus.color}`}>
              {stockStatus.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Information Grid - 2 columns on tablet, 1 on mobile */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Stock
            </p>
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold">{product.stock}</span>
            </div>
            {product.stock <= product.threshold && product.stock > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                Low ({product.threshold})
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Price
            </p>
            <div className="text-sm font-bold text-primary">
              {pricingInfo.display}
            </div>
            {pricingInfo.type === 'unit-pricing' && (
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <Euro className="h-3 w-3" />
                Per unit
              </div>
            )}
          </div>

          {product.has_serial && (
            <div className="space-y-0.5 col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Serial Tracking
              </p>
              <div className="flex items-center gap-1.5 text-green-600">
                <Package className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">
                  {product.stock || 0} unit{product.stock !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <Button
            variant="filled"
            size="sm"
            className="touch-button flex-1 min-w-[100px] h-9"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
          >
            <Info className="h-3.5 w-3.5 mr-1.5" />
            Details
          </Button>
          
          <div onClick={(e) => e.stopPropagation()}>
            <UnifiedInventoryLabels
              productIds={[product.id]}
              companyName="GOLDEN PHONE SRL"
              buttonText=""
              buttonClassName="h-9 w-9 p-0"
            />
          </div>

          <Button
            variant="outlined"
            size="sm"
            className="touch-button h-9 w-9 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>

          <Button
            variant="outlined"
            size="sm"
            className="touch-button h-9 w-9 p-0 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
