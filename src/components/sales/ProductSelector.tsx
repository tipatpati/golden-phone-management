
import React, { useState, useRef, useEffect } from "react";
import { formatProductName, formatProductUnitDisplay, parseSerialString } from "@/utils/productNaming";
import { getProductPricingInfoSync } from "@/utils/unitPricingUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { supabaseProductApi } from "@/services/supabaseProducts";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { logger } from '@/utils/logger';

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
    const productArray = Array.isArray(products) ? products : [];
    if (!selectedCategory) return productArray;
    return productArray.filter(product => product.category_id === selectedCategory);
  }, [products, selectedCategory]);
  
  const filteredAllProducts = React.useMemo(() => {
    const allProductArray = Array.isArray(allProducts) ? allProducts : [];
    if (!selectedCategory) return allProductArray;
    return allProductArray.filter(product => product.category_id === selectedCategory);
  }, [allProducts, selectedCategory]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get existing product names for autocomplete (filtered by category)
  const existingProductNames = filteredAllProducts.map(product => 
    formatProductName({ brand: product.brand, model: product.model })
  );

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
    logger.info('Barcode scanned', { barcode }, 'ProductSelector');
    setProductSearch(barcode);
    
    try {
      // Try to find and automatically add the product using the API
      const scannedProducts = await supabaseProductApi.getProducts(barcode);
      
      // If we find exactly one product, add it automatically
      if (scannedProducts && scannedProducts.length === 1) {
        logger.info('Auto-adding scanned product', { productId: scannedProducts[0].id }, 'ProductSelector');
        onProductAdd(scannedProducts[0]);
        setProductSearch(""); // Clear search after adding
      }
      // If multiple products found, let user choose from the search results
      else if (scannedProducts && scannedProducts.length > 1) {
        logger.info('Multiple products found for barcode', { count: scannedProducts.length }, 'ProductSelector');
      }
      // If no products found, search will remain and show "No products found" message
    } catch (error) {
      logger.error('Error searching for scanned product', { error }, 'ProductSelector');
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
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-base flex-1">
                  {formatProductName({ brand: product.brand, model: product.model })}
                </div>
                {product.has_serial && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Unità
                  </Badge>
                )}
              </div>
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
                    const parsed = parseSerialString(serial);
                    const unitDisplay = formatProductUnitDisplay({
                      brand: product.brand,
                      model: product.model,
                      storage: parsed.storage,
                      color: parsed.color,
                      batteryLevel: parsed.batteryLevel
                    });
                    
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span>Unit: {unitDisplay}</span>
                      </div>
                    );
                  })}
                  {product.serial_numbers.length > 2 && (
                    <div className="text-sm">+{product.serial_numbers.length - 2} more units</div>
                  )}
                </div>
              )}
              <div className="text-sm font-medium mt-2">
                {(() => {
                  const pricingInfo = getProductPricingInfoSync({
                    price: product.price || 0,
                    has_serial: product.has_serial || false,
                    min_price: product.min_price,
                    max_price: product.max_price
                  });
                  
                  return (
                    <span className={
                      pricingInfo.type === 'unit-pricing' ? 'text-blue-600' : 
                      pricingInfo.type === 'no-price' ? 'text-muted-foreground' : 
                      'text-green-600'
                    }>
                      {pricingInfo.display}
                    </span>
                  );
                })()}
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
