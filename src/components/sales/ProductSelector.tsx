
import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useProducts } from "@/services/useProducts";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

type ProductSelectorProps = {
  onProductAdd: (product: any) => void;
};

export function ProductSelector({ onProductAdd }: ProductSelectorProps) {
  const [productSearch, setProductSearch] = useState("");
  const { data: products = [] } = useProducts(productSearch);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search by name, SKU, barcode, or scan barcode..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="pl-8 pr-12"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
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
              <div className="font-medium text-sm">{product.name}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                <span>SKU: {product.sku}</span>
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
                <div className="text-xs text-muted-foreground mt-1">
                  Serial: {product.serial_numbers.slice(0, 2).join(', ')}
                  {product.serial_numbers.length > 2 && ` +${product.serial_numbers.length - 2} more`}
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
