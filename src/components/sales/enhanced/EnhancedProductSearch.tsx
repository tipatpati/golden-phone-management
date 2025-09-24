import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Package, 
  Smartphone, 
  AlertTriangle,
  QrCode,
  ArrowLeft,
  Check
} from "lucide-react";
import { BarcodeScanner } from "@/components/ui/barcode-scanner";
import { toast } from "sonner";
import { SalesProductService } from "@/services/sales/SalesProductService";
import { ProductUnitSelector } from "./ProductUnitSelector";
import type { Product } from "@/services/inventory/types";

interface SaleItemWithUnit {
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
  onProductAdd: (product: SaleItemWithUnit) => void;
}

export const EnhancedProductSearch: React.FC<EnhancedProductSearchProps> = ({
  onProductAdd
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showUnitSelector, setShowUnitSelector] = useState(false);

  // Search for products
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await SalesProductService.getProductsForSales(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Errore durante la ricerca prodotti");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input
  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      performSearch(value);
    } else {
      setSearchResults([]);
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    setShowScanner(false);
    setIsLoading(true);
    
    try {
      const product = await SalesProductService.searchByCode(barcode);
      if (product) {
        // If product has units, show unit selector
        if (product.has_serial && product.product_units && product.product_units.length > 0) {
          setSelectedProduct(product);
          setShowUnitSelector(true);
        } else {
          // Handle non-serialized product
          handleNonSerializedProductSelect(product);
        }
      } else {
        toast.error("Prodotto non trovato per il codice scansionato");
      }
    } catch (error) {
      console.error('Barcode search error:', error);
      toast.error("Errore durante la ricerca del codice a barre");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product selection from search results
  const handleProductSelect = (product: Product) => {
    // Check if product has serialized units
    if (product.has_serial && product.product_units && product.product_units.length > 0) {
      const availableUnits = product.product_units.filter(unit => unit.status === 'available');
      if (availableUnits.length === 0) {
        toast.error("Nessuna unità disponibile per questo prodotto");
        return;
      }
      setSelectedProduct(product);
      setShowUnitSelector(true);
    } else {
      // Handle non-serialized product
      handleNonSerializedProductSelect(product);
    }
  };

  // Handle non-serialized product selection
  const handleNonSerializedProductSelect = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Prodotto non disponibile");
      return;
    }

    const saleItem: SaleItemWithUnit = {
      product_id: product.id,
      quantity: 1,
      unit_price: product.max_price || product.price || 0,
      brand: product.brand,
      model: product.model,
      year: product.year
    };

    onProductAdd(saleItem);
    setSearchTerm("");
    setSearchResults([]);
    toast.success(`${product.brand} ${product.model} aggiunto alla garentille`);
  };

  // Handle unit selection
  const handleUnitSelect = (saleItem: SaleItemWithUnit) => {
    onProductAdd(saleItem);
    setShowUnitSelector(false);
    setSelectedProduct(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  // Handle unit selector cancel
  const handleUnitCancel = () => {
    setShowUnitSelector(false);
    setSelectedProduct(null);
  };

  // Reset search
  const resetSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setShowScanner(false);
    setSelectedProduct(null);
    setShowUnitSelector(false);
  };

  // Show unit selector if selected
  if (showUnitSelector && selectedProduct) {
    return (
      <ProductUnitSelector
        product={selectedProduct}
        onUnitSelect={handleUnitSelect}
        onCancel={handleUnitCancel}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Cerca per nome, IMEI o ultime 4 cifre..."
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowScanner(!showScanner)}
          className="h-10 w-10"
        >
          <QrCode className="h-4 w-4" />
        </Button>
        {(searchTerm || searchResults.length > 0) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetSearch}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Barcode Scanner */}
      {showScanner && (
        <Card className="border-2 border-primary">
          <CardContent className="p-4">
            <div className="text-center space-y-4">
              <QrCode className="h-12 w-12 mx-auto text-primary" />
              <div>
                <h3 className="font-semibold">Scanner Codice a Barre</h3>
                <p className="text-sm text-muted-foreground">
                  Inquadra il codice a barre del prodotto
                </p>
              </div>
              <div className="p-4 border rounded">
                <p className="text-sm">Scanner disponibile - implementazione semplificata</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowScanner(false)}
                className="w-full"
              >
                Annulla Scanner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-muted-foreground">
              Ricerca in corso...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((product) => {
                const availableUnits = product.product_units?.filter(unit => unit.status === 'available') || [];
                const hasAvailableStock = product.has_serial ? availableUnits.length > 0 : product.stock > 0;
                
                return (
                  <div
                    key={product.id}
                    className={`p-4 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !hasAvailableStock ? 'opacity-50' : ''
                    }`}
                    onClick={() => hasAvailableStock && handleProductSelect(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">
                            {product.brand} {product.model}
                            {product.year && ` (${product.year})`}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={hasAvailableStock ? "default" : "destructive"}
                            >
                              {product.has_serial 
                                ? `${availableUnits.length} unità`
                                : `${product.stock} pz`
                              }
                            </Badge>
                            {product.has_serial && (
                              <Badge variant="outline">
                                <Smartphone className="h-3 w-3 mr-1" />
                                Con IMEI
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">
                          €{product.max_price || product.price || 0}
                        </div>
                        {product.min_price && (
                          <div className="text-xs text-muted-foreground">
                            da €{product.min_price}
                          </div>
                        )}
                        {!hasAvailableStock && (
                          <div className="text-xs text-destructive mt-1">
                            Non disponibile
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {searchTerm.length >= 2 && !isLoading && searchResults.length === 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nessun prodotto trovato per "{searchTerm}"</p>
              <p className="text-sm mt-1">
                Prova a cercare con nome, IMEI o scansiona il codice a barre
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Instructions */}
      {!searchTerm && searchResults.length === 0 && !showScanner && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-center text-muted-foreground space-y-2">
              <Package className="h-8 w-8 mx-auto opacity-50" />
              <p className="font-medium">Cerca il prodotto da vendere</p>
              <div className="text-sm space-y-1">
                <p>• Digita il nome del prodotto</p>
                <p>• Inserisci IMEI completo o ultime 4 cifre</p>
                <p>• Usa lo scanner per il codice a barre</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};