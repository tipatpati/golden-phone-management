
import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useProducts } from "@/services/useProducts";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";

type ProductSelectorProps = {
  onProductAdd: (product: any) => void;
};

export function ProductSelector({ onProductAdd }: ProductSelectorProps) {
  const [productSearch, setProductSearch] = useState("");
  const { data: products = [] } = useProducts(productSearch);
  const { data: allProducts = [] } = useProducts(""); // For autocomplete suggestions
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get existing product names for autocomplete
  const existingProductNames = allProducts.map(product => `${product.brand} ${product.model}`);

  const { setupHardwareScanner } = useBarcodeScanner({
    onScan: (result) => {
      setProductSearch(result);
    }
  });

  useEffect(() => {
    if (searchInputRef.current) {
      const cleanup = setupHardwareScanner(searchInputRef.current);
      return cleanup;
    }
  }, [setupHardwareScanner]);

  const handleProductSelect = (product: any) => {
    onProductAdd(product);
    setProductSearch("");
  };

  const handleBarcodeScanned = (barcode: string) => {
    setProductSearch(barcode);
  };

  return (
    <div className="space-y-2">
      <Label>Add Products</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
        <AutocompleteInput
          value={productSearch}
          onChange={setProductSearch}
          suggestions={existingProductNames}
          placeholder="Search by name, serial/IMEI, barcode, or scan barcode..."
          className="pl-8 pr-12"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
          <BarcodeScannerTrigger
            onScan={handleBarcodeScanned}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
          />
        </div>
      </div>
      {productSearch && products.length > 0 && (
        <div className="border rounded-md max-h-40 overflow-y-auto bg-background/95 backdrop-blur z-50">
          {products.slice(0, 8).map((product) => (
            <div
              key={product.id}
              className="p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors"
              onClick={() => handleProductSelect(product)}
            >
              <div className="font-medium text-sm">{product.brand} {product.model}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
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
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
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
                    <div className="text-xs">+{product.serial_numbers.length - 2} more</div>
                  )}
                </div>
              )}
              <div className="text-xs text-green-600 font-medium mt-1">
                Range: ${product.min_price} - ${product.max_price}
              </div>
            </div>
          ))}
        </div>
      )}
      {productSearch && products.length === 0 && (
        <div className="border rounded-md p-2 text-center text-muted-foreground">
          No products found matching "{productSearch}"
        </div>
      )}
    </div>
  );
}
