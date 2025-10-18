import React, { useState, useMemo, useEffect } from "react";
import { formatProductName, formatProductUnitName, parseSerialString } from "@/utils/productNaming";
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
  Info,
  ChevronDown,
  ChevronRight,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProducts } from "@/services/inventory/LightweightInventoryService";
import { UnifiedInventoryLabels } from "./labels/UnifiedInventoryLabels";
import { ProductDetailsDialog } from "./ProductDetailsDialog";
import { UnitDetailsDialog } from "./UnitDetailsDialog";
import { InventoryCard } from "./InventoryCard";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import type { Product as UnifiedProduct } from "@/services/inventory/types";
import { UnitBarcodeManager } from "@/components/shared/forms/UnitBarcodeManager";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";


const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

// Use the unified Product type instead of local interface
type Product = UnifiedProduct;

interface InventoryTableProps {
  products: Product[];
  isLoading: boolean;
  isFetching?: boolean;
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
  isFetching = false,
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [printProductId, setPrintProductId] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [printUnitId, setPrintUnitId] = useState<string | null>(null);
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null);
  const [unitDetailsOpen, setUnitDetailsOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedProductForUnit, setSelectedProductForUnit] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Force re-render when search term changes
  useEffect(() => {
    setRenderKey(prev => prev + 1);
    // Auto-expand products when search finds units
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      const productsWithMatchedUnits = productList.filter(product => 
        product.units?.some((unit: any) => 
          unit.serial_number?.toLowerCase().includes(term) || 
          unit.barcode?.toLowerCase().includes(term)
        )
      );
      setExpandedProducts(new Set(productsWithMatchedUnits.map(p => p.id)));
    } else {
      setExpandedProducts(new Set());
    }
  }, [searchTerm, products]);
  
  // Memoize product list and ensure it updates with search changes
  const productList = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    // Products are already sorted by priority in the service layer
    return list;
  }, [products]);

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

  const getStockStatus = (stock: number = 0, threshold: number = 0) => {
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (stock <= threshold) {
      return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    } else {
      return { label: 'In Stock', color: 'bg-green-100 text-green-800 border-green-200' };
    }
  };

  const toggleProductExpansion = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Helper to check if unit matches search
  const unitMatchesSearch = (unit: any, term: string) => {
    const lowerTerm = term.toLowerCase();
    return unit.serial_number?.toLowerCase().includes(lowerTerm) || 
           unit.barcode?.toLowerCase().includes(lowerTerm);
  };

  const handleDeleteUnit = async (unitId: string) => {
    try {
      const { error } = await supabase
        .from('product_units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;

      toast({
        title: "Unit deleted",
        description: "Product unit has been successfully deleted.",
      });

      // Refresh product list
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteUnitId(null);
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast({
        title: "Error",
        description: "Failed to delete unit. Please try again.",
        variant: "destructive",
      });
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

  // Mobile pagination
  const {
    paginatedData: paginatedMobileProducts,
    currentPage: mobilePage,
    totalPages: mobileTotalPages,
    goToPage: mobileGoToPage
  } = usePagination({ data: productList, itemsPerPage: 17 });

  return (
    <>
      {/* Search Results Banner */}
      {searchTerm && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-900">
              Showing <strong>{productList.length}</strong> result{productList.length !== 1 ? 's' : ''} for "<strong>{searchTerm}</strong>"
            </span>
          </div>
          {isFetching && (
            <div className="text-xs text-blue-600 flex items-center gap-1">
              <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Updating...
            </div>
          )}
        </div>
      )}

      {/* Desktop Table Layout */}
      <div key={`table-${renderKey}`} className="hidden lg:block rounded-md border relative transition-opacity duration-200">
        {/* Loading overlay */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-md transition-all duration-200">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background px-4 py-2 rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading results...
            </div>
          </div>
        )}
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
            const isExpanded = expandedProducts.has(product.id);
            const hasUnits = product.units && product.units.length > 0;
            const searchLower = searchTerm?.toLowerCase() || '';
            const matchedUnits = hasUnits && searchTerm 
              ? product.units.filter((unit: any) => unitMatchesSearch(unit, searchTerm))
              : [];
            
            return (
              <React.Fragment key={product.id}>
                <TableRow 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 transition-colors",
                    isSelected ? "bg-muted/50" : "",
                    matchedUnits.length > 0 ? "bg-blue-50/30" : ""
                  )}
                  onClick={() => handleRowClick(product)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          onSelectItem(product.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${product.brand} ${product.model}`}
                      />
                      {hasUnits && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => toggleProductExpansion(product.id, e)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
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
                        {matchedUnits.length > 0 && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {matchedUnits.length} matched unit{matchedUnits.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
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
                      <div onClick={(e) => e.stopPropagation()}>
                        <UnifiedInventoryLabels
                          productIds={[product.id]}
                          companyName="GOLDEN PHONE SRL"
                          buttonText=""
                          buttonClassName="h-8 w-8 p-0"
                        />
                      </div>
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
                
                {/* Expanded Unit Rows */}
                {isExpanded && hasUnits && (
                  <>
                    {product.units.map((unit: any) => {
                      const isMatched = searchTerm && unitMatchesSearch(unit, searchTerm);
                      return (
                        <TableRow 
                          key={unit.id}
                          className={cn(
                            "bg-muted/20 border-l-4",
                            isMatched ? "border-l-blue-500 bg-blue-50/50" : "border-l-transparent"
                          )}
                        >
                          <TableCell></TableCell>
                          <TableCell colSpan={2}>
                            <div className="pl-8 space-y-1">
                              <div className="flex items-center gap-2">
                                <Hash className="h-3 w-3 text-muted-foreground" />
                                <span className={cn(
                                  "text-sm font-mono",
                                  isMatched && "font-semibold text-blue-700"
                                )}>
                                  {unit.serial_number}
                                </span>
                                {isMatched && (
                                  <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                                    Match
                                  </Badge>
                                )}
                              </div>
                              {unit.barcode && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Barcode className="h-3 w-3" />
                                  <span className={cn(
                                    "font-mono",
                                    isMatched && unit.barcode.toLowerCase().includes(searchLower) && "font-semibold text-blue-700"
                                  )}>
                                    {unit.barcode}
                                  </span>
                                </div>
                              )}
                              {(unit.color || unit.storage || unit.ram) && (
                                <div className="flex gap-2 text-xs">
                                  {unit.color && <Badge variant="outline">{unit.color}</Badge>}
                                  {unit.storage && <Badge variant="outline">{unit.storage}GB</Badge>}
                                  {unit.ram && <Badge variant="outline">{unit.ram}GB RAM</Badge>}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={cn(
                                unit.status === 'available' ? 'bg-green-100 text-green-800' : 
                                unit.status === 'sold' ? 'bg-gray-100 text-gray-800' : 
                                'bg-yellow-100 text-yellow-800'
                              )}
                            >
                              {unit.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {unit.max_price ? (
                                <span className="font-medium text-green-600">
                                  €{unit.max_price.toFixed(2)}
                                </span>
                              ) : unit.price ? (
                                <span className="text-muted-foreground">
                                  €{unit.price.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {unit.condition && (
                              <Badge variant="outline" className="text-xs">
                                {unit.condition}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUnit(unit);
                                  setSelectedProductForUnit(product);
                                  setUnitDetailsOpen(true);
                                }}
                                className="h-7 w-7 p-0"
                                title="View unit details"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPrintUnitId(unit.id);
                                }}
                                className="h-7 w-7 p-0"
                                title="Print barcode"
                              >
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUnit(unit);
                                  setSelectedProductForUnit(product);
                                  setUnitDetailsOpen(true);
                                }}
                                className="h-7 w-7 p-0"
                                title="Edit unit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteUnitId(unit.id);
                                }}
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Delete unit"
                                disabled={unit.status === 'sold'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>

      {/* Mobile & Tablet Card Layout */}
      <div className="lg:hidden space-y-4">
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2">
          {paginatedMobileProducts.map((product) => (
            <InventoryCard
              key={product.id}
              product={product}
              isSelected={selectedItems.includes(product.id)}
              onSelect={onSelectItem}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={handleRowClick}
            />
          ))}
        </div>

        {/* Mobile Pagination */}
        {productList.length > 0 && (
          <TablePagination
            currentPage={mobilePage}
            totalPages={mobileTotalPages}
            onPageChange={mobileGoToPage}
            pageSize={17}
            totalItems={productList.length}
          />
        )}
      </div>

    <ProductDetailsDialog
      product={selectedProductForDetails as any}
      open={detailsDialogOpen}
      onOpenChange={setDetailsDialogOpen}
      onEdit={(product) => {
        setDetailsDialogOpen(false);
        onEdit(product as Product);
      }}
      onPrint={(product) => {
        setDetailsDialogOpen(false);
        setPrintProductId(product.id);
      }}
    />

    {/* Hidden label printer for products */}
    {printProductId && (
      <UnifiedInventoryLabels
        productIds={[printProductId]}
        companyName="GOLDEN PHONE SRL"
        buttonText=""
        buttonClassName="hidden"
        autoOpen={true}
        onClose={() => setPrintProductId(null)}
      />
    )}

    {/* Unit barcode printer */}
    {printUnitId && (() => {
      // Find the unit to print
      const unitToPrint = productList
        .flatMap(p => p.units || [])
        .find((u: any) => u.id === printUnitId);
      
      if (!unitToPrint) return null;

      return (
        <UnitBarcodeManager
          units={[{
            serial: unitToPrint.serial_number,
            color: unitToPrint.color,
            storage: unitToPrint.storage,
            ram: unitToPrint.ram,
            battery_level: unitToPrint.battery_level,
            price: unitToPrint.price
          }]}
          productId={unitToPrint.product_id}
          existingUnitBarcodes={{ [unitToPrint.serial_number]: unitToPrint.barcode }}
          showPrintButton={false}
          onPrintRequested={(barcodes) => {
            // Auto-trigger print after component mounts
            setTimeout(() => setPrintUnitId(null), 1000);
          }}
        />
      );
    })()}

    {/* Unit Details Dialog */}
    <UnitDetailsDialog
      unit={selectedUnit}
      product={selectedProductForUnit}
      open={unitDetailsOpen}
      onOpenChange={setUnitDetailsOpen}
      onPrint={(unitId) => {
        setUnitDetailsOpen(false);
        setPrintUnitId(unitId);
      }}
    />

    {/* Delete unit confirmation */}
    <AlertDialog open={!!deleteUnitId} onOpenChange={(open) => !open && setDeleteUnitId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Unit</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this product unit? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteUnitId && handleDeleteUnit(deleteUnitId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}