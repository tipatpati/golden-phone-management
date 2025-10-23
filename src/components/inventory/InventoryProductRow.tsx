import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Edit,
  Trash2,
  Package,
  Euro,
  Info,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatProductName, parseSerialString } from "@/utils/productNaming";
import { getProductPricingInfoSync } from "@/utils/unitPricingUtils";
import type { Product as UnifiedProduct } from "@/services/inventory/types";

interface InventoryProductRowProps {
  product: UnifiedProduct;
  isSelected: boolean;
  isExpanded: boolean;
  hasUnits: boolean;
  matchedUnitsCount: number;
  searchTerm?: string;
  onRowClick: (product: UnifiedProduct) => void;
  onSelect: (productId: string) => void;
  onToggleExpansion: (productId: string, e: React.MouseEvent) => void;
  onViewDetails: (product: UnifiedProduct) => void;
  onEdit: (product: UnifiedProduct) => void;
  onDelete: (productId: string) => void;
  renderPrintButton?: (product: UnifiedProduct) => React.ReactNode;
}

export const InventoryProductRow = React.memo(({
  product,
  isSelected,
  isExpanded,
  hasUnits,
  matchedUnitsCount,
  searchTerm = "",
  onRowClick,
  onSelect,
  onToggleExpansion,
  onViewDetails,
  onEdit,
  onDelete,
  renderPrintButton
}: InventoryProductRowProps) => {
  const getStockStatus = (stock: number = 0, threshold: number = 0) => {
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (stock <= threshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const getCategoryBadgeColor = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'smartphones':
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

  const stockStatus = getStockStatus(product.stock, product.threshold);

  return (
    <TableRow
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected ? "bg-muted/50" : "",
        matchedUnitsCount > 0 ? "bg-blue-50/30" : ""
      )}
      onClick={() => onRowClick(product)}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(product.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${product.brand} ${product.model}`}
          />
          {hasUnits && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => onToggleExpansion(product.id, e)}
              aria-label={isExpanded ? `Collapse units for ${product.brand} ${product.model}` : `Expand units for ${product.brand} ${product.model}`}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium flex items-center gap-2">
            {(() => {
              const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
              const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();

              let storage;
              if (product.serial_numbers && product.serial_numbers.length > 0) {
                const parsed = parseSerialString(product.serial_numbers[0]);
                storage = parsed.storage;
              }

              return formatProductName({
                brand: cleanBrand,
                model: cleanModel,
                storage
              });
            })()}
            {matchedUnitsCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {matchedUnitsCount} matched unit{matchedUnitsCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {product.year && (
            <div className="text-sm text-muted-foreground">
              {product.year}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {product.category_name && (
          <Badge
            variant="outline"
            className={getCategoryBadgeColor(product.category_name)}
          >
            {product.category_name}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge
            variant="outline"
            className={stockStatus.color}
          >
            {stockStatus.label}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {product.stock || 0} / {product.threshold || 0}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {(() => {
            const pricingInfo = getProductPricingInfoSync({
              price: product.price || 0,
              has_serial: product.has_serial,
              min_price: product.min_price,
              max_price: product.max_price
            });

            return (
              <>
                <div className="text-sm">
                  <span className={cn(
                    "font-medium",
                    pricingInfo.type === 'unit-pricing' ? "text-blue-600" : "text-primary",
                    pricingInfo.type === 'no-price' ? "text-muted-foreground" : ""
                  )}>
                    {pricingInfo.display}
                  </span>
                </div>
                {pricingInfo.type === 'unit-pricing' && (
                  <div className="text-xs text-blue-600 flex items-center gap-1">
                    <Euro className="h-3 w-3" aria-hidden="true" />
                    Click info to set unit prices
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="text-sm">
            {product.has_serial ? (
              <div className="flex items-center gap-1 text-green-600">
                <Package className="h-3 w-3" aria-hidden="true" />
                Serial Tracking
              </div>
            ) : (
              <div className="text-muted-foreground">No Serial</div>
            )}
          </div>
          {product.serial_numbers && product.serial_numbers.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {product.serial_numbers.length} unit{product.serial_numbers.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2" role="group" aria-label="Product actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="h-8 w-8 p-0"
            title="View details and manage unit pricing"
            aria-label={`View details for ${product.brand} ${product.model}`}
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </Button>
          {renderPrintButton && (
            <div onClick={(e) => e.stopPropagation()}>
              {renderPrintButton(product)}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
            disabled={product.has_serial && product.stock === 0}
            className="h-8 w-8 p-0"
            aria-label={`Edit ${product.brand} ${product.model}`}
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product.id);
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            aria-label={`Delete ${product.brand} ${product.model}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

InventoryProductRow.displayName = 'InventoryProductRow';
