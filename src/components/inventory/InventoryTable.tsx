import React, { useState } from "react";
import { formatProductName, formatProductUnitName, parseSerialString } from "@/utils/productNaming";
import { getProductPricingInfoSync } from "@/utils/unitPricingUtils";
import { supabase } from "@/integrations/supabase/client";
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
import { useProducts } from "@/services/inventory/LightweightInventoryService";
import { ThermalLabelGenerator } from "./labels";
import { ProductDetailsDialog } from "./ProductDetailsDialog";
import { logger } from '@/utils/logger';

const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

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
  units?: Array<{
    id: string;
    serial_number: string;
    barcode?: string;
    color?: string;
    storage?: number;
    ram?: number;
    battery_level?: number;
    status: string;
    price?: number;
    min_price?: number;
    max_price?: number;
  }>;
}

interface InventoryTableProps {
  products: Product[];
  isLoading: boolean;
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
  products,
  isLoading,
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  
  // Use products passed from parent - no double data fetching
  const productList = Array.isArray(products) ? products : [];

  const handlePrintLabels = async (product: Product) => {
    try {
      // Fetch latest product units data to ensure barcodes are up to date
      const { data: units, error } = await supabase
        .from('product_units')
        .select('*')
        .eq('product_id', product.id);

      if (error) {
        console.error('Failed to fetch latest units:', error);
        setSelectedProduct(product);
      } else {
        // Update product with latest units data and convert to expected format
        const latestSerialNumbers = units?.map(unit => unit.serial_number) || [];
        const updatedProduct = {
          ...product,
          units: units || [],
          serial_numbers: latestSerialNumbers
        };
        logger.info('Print button: Units found', { 
          unitsCount: units?.length || 0, 
          product: `${product.brand} ${product.model}` 
        }, 'InventoryTable');
        setSelectedProduct(updatedProduct);
      }
    } catch (error) {
      console.error('Error syncing product data:', error);
      setSelectedProduct(product);
    }
    
    setPrintDialogOpen(true);
  };

  const handleRowClick = (product: Product) => {
    setSelectedProductForDetails(product);
    setDetailsDialogOpen(true);
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
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors",
                  isSelected ? "bg-muted/50" : ""
                )}
                onClick={() => handleRowClick(product)}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      onSelectItem(product.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
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
                              <Euro className="h-3 w-3" />
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
                        setSelectedProductForDetails(product);
                        setDetailsDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                      title="View details and manage unit pricing"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintLabels(product);
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
          })}
        </TableBody>
      </Table>
    </div>
    
    {selectedProduct && (
      <ThermalLabelGenerator
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        labels={[]} // Start with empty labels when using unit selection
        allowUnitSelection={selectedProduct.units && selectedProduct.units.length > 0}
        productId={selectedProduct.id} // Pass productId for real data fetching
        productSerialNumbers={selectedProduct.units?.map(unit => unit.serial_number) || selectedProduct.serial_numbers || []}
        productName={(() => {
          const cleanBrand = selectedProduct.brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
          const cleanModel = selectedProduct.model.replace(/\s*\([^)]*\)\s*/g, '').trim();
          return formatProductName({ brand: cleanBrand, model: cleanModel });
        })()}
        productPrice={selectedProduct.price || 0}
        productMaxPrice={selectedProduct.max_price}
        productMinPrice={selectedProduct.min_price}
        productBarcode={selectedProduct.barcode}
        productCategory={selectedProduct.category?.name}
        companyName="GOLDEN PHONE SRL"
      />
    )}

    <ProductDetailsDialog
      product={selectedProductForDetails}
      open={detailsDialogOpen}
      onOpenChange={setDetailsDialogOpen}
      onEdit={(product) => {
        setDetailsDialogOpen(false);
        onEdit(product);
      }}
      onPrint={(product) => {
        setDetailsDialogOpen(false);
        handlePrintLabels(product);
      }}
    />
    </>
  );
}