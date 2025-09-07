import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Scan, Plus, Package, Hash, Zap } from "lucide-react";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useProducts } from "@/services/products/ProductReactQueryService";
import { formatProductName } from "@/utils/productNaming";
import { toast } from "@/components/ui/sonner";

type Product = {
  id: string;
  brand: string;
  model: string;
  price: number;
  min_price: number;
  max_price: number;
  stock: number;
  serial_numbers?: string[];
  barcode?: string;
  category_id?: number;
};

type EnhancedProductSearchProps = {
  onProductAdd: (product: Product) => void;
  selectedCategory?: number | null;
  recentProducts?: Product[];
};

export function EnhancedProductSearch({ 
  onProductAdd, 
  selectedCategory,
  recentProducts = []
}: EnhancedProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { data: products = [] } = useProducts(searchTerm);
  
  // Filter products by category and search term
  const filteredProducts = React.useMemo(() => {
    const productArray = Array.isArray(products) ? products : [];
    let filtered = productArray;
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }
    
    return filtered.slice(0, 6); // Limit to 6 results for clean UI
  }, [products, selectedCategory]);

  // Quick add recent products (last 5)
  const quickAddProducts = React.useMemo(() => {
    return recentProducts.slice(0, 4);
  }, [recentProducts]);

  const handleProductSelect = (product: Product) => {
    onProductAdd(product);
    setSearchTerm("");
    setIsSearchFocused(false);
    toast.success(`${product.brand} ${product.model} aggiunto alla vendita`);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setSearchTerm(barcode);
    // Auto-search will trigger via the searchTerm change
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredProducts.length === 1) {
      e.preventDefault();
      handleProductSelect(filteredProducts[0]);
    }
  };

  const showResults = isSearchFocused && searchTerm.length >= 2;
  const showQuickAdd = !searchTerm && quickAddProducts.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
          <Input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Cerca prodotto per nome, codice, IMEI..."
            className="pl-10 pr-16 h-14 text-base bg-background border-2 focus:border-primary"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <BarcodeScannerTrigger
              onScan={handleBarcodeScanned}
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-primary/10"
            >
              <Scan className="h-5 w-5" />
            </BarcodeScannerTrigger>
          </div>
        </div>

        {/* Search tip */}
        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <p className="text-sm text-muted-foreground mt-2">
            Continua a digitare per cercare prodotti...
          </p>
        )}
      </div>

      {/* Quick Add Recent Products */}
      {showQuickAdd && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">Aggiungi Rapido</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickAddProducts.map((product) => (
              <Button
                key={product.id}
                variant="outline"
                size="sm"
                onClick={() => handleProductSelect(product)}
                className="justify-start h-auto p-3 text-left"
              >
                <div className="flex items-center gap-2 w-full">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {formatProductName({ brand: product.brand, model: product.model })}
                    </div>
                    <div className="text-xs text-muted-foreground">€{product.price}</div>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Search Results */}
      {showResults && (
        <Card className="absolute z-50 w-full bg-background border-2 border-primary/20 shadow-xl">
          {filteredProducts.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 active:bg-muted ${
                    index !== filteredProducts.length - 1 ? 'border-b' : ''
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base mb-1">
                        {formatProductName({ brand: product.brand, model: product.model })}
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}>
                          <Package className="h-3 w-3 mr-1" />
                          {product.stock} in stock
                        </Badge>
                        {product.barcode && (
                          <Badge variant="outline">
                            <Hash className="h-3 w-3 mr-1" />
                            {product.barcode}
                          </Badge>
                        )}
                      </div>

                      {product.serial_numbers && product.serial_numbers.length > 0 && (
                        <div className="text-sm text-muted-foreground mb-2">
                          Seriali: {product.serial_numbers.slice(0, 2).join(", ")}
                          {product.serial_numbers.length > 2 && ` (+${product.serial_numbers.length - 2} altri)`}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold text-primary">€{product.price}</div>
                      {product.min_price !== product.max_price && (
                        <div className="text-sm text-muted-foreground">
                          €{product.min_price} - €{product.max_price}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-muted-foreground mb-2">Nessun prodotto trovato</div>
              <div className="text-sm text-muted-foreground">
                Prova con un termine di ricerca diverso
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}