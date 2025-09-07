import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Scan } from "lucide-react";
import { toast } from "sonner";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useQuery } from "@tanstack/react-query";
import { SalesProductService } from "@/services/sales/SalesProductService";
import { ProductUnitSelector } from "./ProductUnitSelector";
import type { Product, ProductUnit } from "@/services/inventory/types";

interface SaleItem {
  product_id: string;
  product_unit_id?: string;
  serial_number?: string;
  barcode?: string;
  quantity: number;
  unit_price: number;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  storage?: number;
  ram?: number;
}

interface EnhancedProductSearchProps {
  onProductAdd: (saleItem: SaleItem) => void;
  selectedCategory?: number | null;
  recentProducts?: Product[];
}

export const EnhancedProductSearch: React.FC<EnhancedProductSearchProps> = ({
  onProductAdd,
  selectedCategory,
  recentProducts = []
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['sales-products', searchTerm.trim(), selectedCategory],
    queryFn: () => SalesProductService.getProductsForSales(searchTerm.trim()),
    enabled: searchTerm.trim().length >= 2,
    staleTime: 30000 // 30 seconds
  });

  // Filter and limit results
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }
    
    // Limit to 6 results for better UX
    return filtered.slice(0, 6);
  }, [products, selectedCategory]);

  // Get recent products for quick add (limit to 4)
  const quickAddProducts = useMemo(() => {
    return recentProducts.slice(0, 4);
  }, [recentProducts]);

  const handleProductSelect = (product: Product) => {
    // Check if product has units - if so, show unit selector
    if (product.product_units && product.product_units.length > 0) {
      setSelectedProduct(product);
      setSearchTerm("");
      setIsSearchFocused(false);
    } else {
      // Legacy fallback - create a basic sale item
      const saleItem: SaleItem = {
        product_id: product.id,
        quantity: 1,
        unit_price: product.max_price || product.price || 0,
        brand: product.brand,
        model: product.model,
        year: product.year
      };
      onProductAdd(saleItem);
      setSearchTerm("");
      setIsSearchFocused(false);
      toast.success(`${product.brand} ${product.model} aggiunto alla vendita`);
    }
  };

  const handleUnitSelect = (saleItem: SaleItem) => {
    setSelectedProduct(null);
    onProductAdd(saleItem);
  };

  const handleCancelUnitSelection = () => {
    setSelectedProduct(null);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    // Try to find exact match first
    try {
      const product = await SalesProductService.searchByCode(barcode);
      if (product) {
        handleProductSelect(product);
        return;
      }
    } catch (error) {
      console.error('Error searching by barcode:', error);
    }
    
    // Fallback to regular search
    setSearchTerm(barcode);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredProducts.length === 1) {
      e.preventDefault();
      handleProductSelect(filteredProducts[0]);
    }
  };

  const shouldShowResults = isSearchFocused && searchTerm.length >= 2 && !isLoading;

  // Show unit selector if product is selected
  if (selectedProduct) {
    return (
      <ProductUnitSelector
        product={selectedProduct}
        onUnitSelect={handleUnitSelect}
        onCancel={handleCancelUnitSelection}
      />
    );
  }

  return (
    <div className="relative w-full">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Cerca prodotto per nome, codice, IMEI o ultimi 4 cifre seriale..."
            className="pl-10 pr-16 h-14 text-base bg-background border-2 focus:border-primary"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <BarcodeScannerTrigger 
              onScan={handleBarcodeScanned}
              variant="outline"
              size="icon"
            >
              <Scan className="h-4 w-4" />
            </BarcodeScannerTrigger>
          </div>
        </div>

        {/* Quick Add Recent Products */}
        {!searchTerm && quickAddProducts.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Aggiungi Rapido</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickAddProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {product.brand} {product.model}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Stock: {product.stock}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">
                        €{product.max_price || product.price || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {shouldShowResults && (
          <Card className="absolute z-50 w-full bg-background border shadow-lg">
            <CardContent className="p-0">
              {filteredProducts.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        index < filteredProducts.length - 1 ? 'border-b' : ''
                      }`}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">
                            {product.brand} {product.model}
                            {product.year && (
                              <span className="text-muted-foreground ml-1">({product.year})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge 
                              variant={product.stock > 0 ? "default" : "destructive"}
                              className="text-xs"
                            >
                              Stock: {product.stock}
                            </Badge>
                            {product.barcode && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {product.barcode}
                              </span>
                            )}
                            {product.product_units && product.product_units.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {product.product_units.filter(u => u.status === 'available').length} Unità
                              </Badge>
                            )}
                            {product.serial_numbers && product.serial_numbers.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {product.serial_numbers.length} Seriali (Legacy)
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xl font-bold text-primary">€{product.max_price || product.price || 0}</div>
                          {product.min_price && product.min_price !== (product.max_price || product.price) && (
                            <div className="text-sm text-muted-foreground">
                              €{product.min_price} - €{product.max_price || product.price}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nessun prodotto trovato</p>
                  <p className="text-sm text-muted-foreground">
                    Prova con un termine diverso
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};