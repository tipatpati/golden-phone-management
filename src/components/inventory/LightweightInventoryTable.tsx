import React, { useState, memo } from "react";
import { formatProductName } from "@/utils/productNaming";
import { getProductPricingInfoSync } from "@/utils/unitPricingUtils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  Barcode,
  Printer,
  Euro,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  brand: string;
  model: string;
  year?: number;
  category?: { id: number; name: string };
  price?: number;
  min_price?: number;
  max_price?: number;
  stock: number;
  threshold: number;
  description?: string;
  supplier?: string;
  barcode?: string;
  has_serial: boolean;
  serial_numbers?: string[];
}

interface Props {
  products: Product[];
  isLoading: boolean;
  selectedItems: string[];
  onSelectItem: (id: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

// Memoized row component to prevent unnecessary re-renders
const ProductRow = memo(({ 
  product, 
  isSelected, 
  onSelectItem, 
  onEdit, 
  onDelete,
  onPrint,
  onDetails
}: {
  product: Product;
  isSelected: boolean;
  onSelectItem: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onPrint: (product: Product) => void;
  onDetails: (product: Product) => void;
}) => {
  const stockStatus = getStockStatus(product.stock, product.threshold);

  return (
    <TableRow 
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected ? "bg-muted/50" : ""
      )}
      onClick={() => onDetails(product)}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelectItem(product.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">
            {formatProductName({ 
              brand: product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim(), 
              model: product.model.replace(/\s*\([^)]*\)\s*/g, '').trim()
            })}
          </div>
          {product.year && (
            <div className="text-sm text-muted-foreground">{product.year}</div>
          )}
          {product.barcode && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Barcode className="h-3 w-3" />
              {product.barcode}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {product.category ? (
          <Badge variant="outline" className={getCategoryBadgeColor(product.category.name)}>
            {product.category.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{product.stock}</span>
          </div>
          <Badge variant="outline" className={stockStatus.color}>
            {stockStatus.label}
          </Badge>
          {product.stock <= product.threshold && product.stock > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="h-3 w-3" />
              Threshold: {product.threshold}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <PricingCell product={product} />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="text-sm">
            {product.has_serial ? (
              <div className="flex items-center gap-1 text-green-600">
                <Package className="h-3 w-3" />
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
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDetails(product);
            }}
            className="h-8 w-8 p-0"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPrint(product);
            }}
            className="h-8 w-8 p-0"
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
            }}
            disabled={product.has_serial && product.stock === 0}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(product.id);
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

// Memoized pricing component
const PricingCell = memo(({ product }: { product: Product }) => {
  const pricingInfo = getProductPricingInfoSync({
    price: product.price || 0,
    has_serial: product.has_serial,
    min_price: product.min_price,
    max_price: product.max_price
  });
  
  return (
    <div className="space-y-1">
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
          <Euro className="h-3 w-3" />
          Click info to set unit prices
        </div>
      )}
    </div>
  );
});

export function LightweightInventoryTable({ 
  products,
  isLoading,
  selectedItems,
  onSelectItem,
  onSelectAll,
  isAllSelected,
  isIndeterminate,
  onEdit,
  onDelete
}: Props) {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);

  const handlePrintLabels = (product: Product) => {
    setSelectedProduct(product);
    setPrintDialogOpen(true);
  };

  const handleRowClick = (product: Product) => {
    setSelectedProductForDetails(product);
    setDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Checkbox disabled /></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Serial Info</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}>
                    <div className="h-6 bg-muted animate-pulse rounded" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label="Select all products"
              />
            </TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Pricing</TableHead>
            <TableHead>Serial Info</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              isSelected={selectedItems.includes(product.id)}
              onSelectItem={onSelectItem}
              onEdit={onEdit}
              onDelete={onDelete}
              onPrint={handlePrintLabels}
              onDetails={handleRowClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper functions
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

ProductRow.displayName = 'ProductRow';
PricingCell.displayName = 'PricingCell';