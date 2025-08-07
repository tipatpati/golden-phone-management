
import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useProducts } from "@/services/useProducts";
import { supabaseProductApi } from "@/services/supabaseProducts";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";

type ProductSelectorProps = {
  onProductAdd: (product: any) => void;
  selectedCategory?: number | null;
};

export function ProductSelector({ onProductAdd, selectedCategory }: ProductSelectorProps) {
  const [productSearch, setProductSearch] = useState("");
  const { data: products = [] } = useProducts(productSearch);
  const { data: allProducts = [] } = useProducts(""); // For autocomplete suggestions
  
  // Filter products by category if one is selected
  const filteredProducts = React.useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(product => product.category_id === selectedCategory);
  }, [products, selectedCategory]);
  
  const filteredAllProducts = React.useMemo(() => {
    if (!selectedCategory) return allProducts;
    return allProducts.filter(product => product.category_id === selectedCategory);
  }, [allProducts, selectedCategory]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get existing product names for autocomplete (filtered by category)
  const existingProductNames = filteredAllProducts.map(product => `${product.brand} ${product.model}`);

  const { setupHardwareScanner } = useBarcodeScanner({
    onScan: (result) => {
      handleBarcodeScanned(result);
    }
  });

  useEffect(() => {
    // Hardware scanner setup will be handled differently since AutocompleteInput doesn't accept ref
    // We'll use a workaround to get the input element
    const timer = setTimeout(() => {
      const inputElement = document.querySelector('[placeholder*="Cerca per nome"]') as HTMLInputElement;
      if (inputElement) {
        const cleanup = setupHardwareScanner(inputElement);
        return cleanup;
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [setupHardwareScanner]);

  const handleProductSelect = (product: any) => {
    onProductAdd(product);
    setProductSearch("");
  };

  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    setProductSearch(barcode);
    
    try {
      // Try to find and automatically add the product using the API
      const scannedProducts = await supabaseProductApi.getProducts(barcode);
      
      // If we find exactly one product, add it automatically
      if (scannedProducts && scannedProducts.length === 1) {
        console.log('Auto-adding scanned product:', scannedProducts[0]);
        onProductAdd(scannedProducts[0]);
        setProductSearch(""); // Clear search after adding
      }
      // If multiple products found, let user choose from the search results
      else if (scannedProducts && scannedProducts.length > 1) {
        console.log(`Found ${scannedProducts.length} products for barcode, showing options`);
      }
      // If no products found, search will remain and show "No products found" message
    } catch (error) {
      console.error('Error searching for scanned product:', error);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Aggiungi Prodotti</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <AutocompleteInput
          value={productSearch}
          onChange={setProductSearch}
          suggestions={existingProductNames}
          placeholder="Cerca per nome, seriale/IMEI, barcode o scansiona..."
          className="pl-10 pr-12 h-12 text-base"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
          <BarcodeScannerTrigger
            onScan={handleBarcodeScanned}
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted/50"
          />
        </div>
      </div>
      {productSearch && filteredProducts.length > 0 && (
        <div className="border rounded-lg max-h-64 overflow-y-auto bg-background shadow-lg">
          {filteredProducts.slice(0, 8).map((product) => (
            <div
              key={product.id}
              className="p-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors active:bg-muted"
              onClick={() => handleProductSelect(product)}
            >
              <div className="font-medium text-base">{product.brand} {product.model}</div>
              <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-2">
                <span>
                  {product.serial_numbers?.[0] ? 
                    `Serial: ${product.serial_numbers[0]}` : 
                    `ID: ${product.id.slice(0, 8)}`}
                </span>
                <span>•</span>
                <span>Stock: {product.stock}</span>
                {product.barcode && (
                  <>
                    <span>•</span>
                    <span>Barcode: {product.barcode}</span>
                  </>
                )}
              </div>
              {product.serial_numbers && product.serial_numbers.length > 0 && (
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  {product.serial_numbers.slice(0, 2).map((serial, index) => {
                    const parts = serial.split(' ');
                    const serialNumber = parts.slice(0, -1).join(' ') || parts[0];
                    const battery = parts.length > 1 ? parseInt(parts[parts.length - 1]) : null;
                    
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span>Serial: {serialNumber}</span>
                        {battery !== null && !isNaN(battery) && battery >= 0 && battery <= 100 && (
                          <span className="text-green-600 font-medium">🔋{battery}%</span>
                        )}
                      </div>
                    );
                  })}
                  {product.serial_numbers.length > 2 && (
                    <div className="text-sm">+{product.serial_numbers.length - 2} more</div>
                  )}
                </div>
              )}
              <div className="text-sm text-green-600 font-medium mt-2">
                Range: €{product.min_price} - €{product.max_price}
              </div>
            </div>
          ))}
        </div>
      )}
      {productSearch && filteredProducts.length === 0 && (
        <div className="border rounded-lg p-4 text-center text-muted-foreground bg-background">
          Nessun prodotto trovato per "{productSearch}"
        </div>
      )}
    </div>
  );
}
