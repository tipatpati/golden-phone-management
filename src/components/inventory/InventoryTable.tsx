import React, { useState } from "react";
import { formatProductName, formatProductUnitName, parseSerialString } from "@/utils/productNaming";
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
  Printer
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProducts } from "@/services/products/ProductReactQueryService";
import { ThermalLabelGenerator } from "./labels";

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

interface Product {
  id: string;
  brand: string;
  model: string;
  year?: number;
  category?: { id: number; name: string };
  price: number;
  min_price: number;
  max_price: number;
  stock: number;
  threshold: number;
  description?: string;
  supplier?: string;
  barcode?: string;
  has_serial: boolean;
  serial_numbers?: string[];
}

interface InventoryTableProps {
  searchTerm?: string;
  viewMode?: "list" | "grid";
  selectedItems: string[];
  onSelectItem: (id: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export function InventoryTable({ 
  searchTerm = "",
  viewMode = "list",
  selectedItems,
  onSelectItem,
  onSelectAll,
  isAllSelected,
  isIndeterminate,
  onEdit,
  onDelete
}: InventoryTableProps) {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Import the actual products data
  const { data: products = [], isLoading } = useProducts(searchTerm);
  
  // Ensure products is always an array
  const productList = Array.isArray(products) ? products : [];

  const handlePrintLabels = (product: Product) => {
    setSelectedProduct(product);
    setPrintDialogOpen(true);
  };

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

  if (isLoading || !products) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox disabled />
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
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
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
    <>
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
          {productList.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.threshold);
            const isSelected = selectedItems.includes(product.id);
            
            return (
              <TableRow 
                key={product.id}
                className={isSelected ? "bg-muted/50" : ""}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelectItem(product.id)}
                    aria-label={`Select ${product.brand} ${product.model}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {(() => {
                        // Clean the brand and model by removing all color info in parentheses
                        const cleanBrand = product.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
                        const cleanModel = product.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
                        
                        // Check if product has serial numbers with storage info
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
                    </div>
                    {product.year && (
                      <div className="text-sm text-muted-foreground">
                        {product.year}
                      </div>
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
                    <Badge 
                      variant="outline" 
                      className={getCategoryBadgeColor(product.category.name)}
                    >
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
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">{formatCurrency(product.price)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Range: {formatCurrency(product.min_price)} - {formatCurrency(product.max_price)}
                    </div>
                  </div>
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
                      onClick={() => handlePrintLabels(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(product.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    
    {selectedProduct && (
      <ThermalLabelGenerator
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        labels={selectedProduct.serial_numbers && selectedProduct.serial_numbers.length > 0 ? 
          selectedProduct.serial_numbers.map((serialNumber, index) => {
            // Parse serial number for color, storage, and battery info
            const parsed = parseSerialString(serialNumber);
            
            // Clean the brand and model by removing all color info in parentheses
            const cleanBrand = selectedProduct.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
            const cleanModel = selectedProduct.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
            
            return {
              productName: formatProductUnitName({ 
                brand: cleanBrand, 
                model: cleanModel, 
                storage: parsed.storage,
                color: parsed.color
              }),
              serialNumber: parsed.serial,
              barcode: selectedProduct.barcode || `${cleanBrand}-${cleanModel}-${parsed.serial}`,
              price: selectedProduct.price,
              category: selectedProduct.category?.name,
              color: parsed.color,
              batteryLevel: parsed.batteryLevel
            };
          }) :
          [{
            productName: (() => {
              const cleanBrand = selectedProduct.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
              const cleanModel = selectedProduct.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
              return formatProductName({ 
                brand: cleanBrand, 
                model: cleanModel 
              });
            })(),
            serialNumber: undefined,
            barcode: (() => {
              const cleanBrand = selectedProduct.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
              const cleanModel = selectedProduct.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
              return selectedProduct.barcode || `${cleanBrand}-${cleanModel}`;
            })(),
            price: selectedProduct.price,
            category: selectedProduct.category?.name
          }]
        }
        companyName="GOLDEN PHONE SRL"
      />
    )}
    </>
  );
}