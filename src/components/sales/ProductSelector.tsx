
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useProducts } from "@/services/useProducts";

type ProductSelectorProps = {
  onProductAdd: (product: any) => void;
};

export function ProductSelector({ onProductAdd }: ProductSelectorProps) {
  const [productSearch, setProductSearch] = useState("");
  const { data: products = [] } = useProducts(productSearch);

  const handleProductSelect = (product: any) => {
    onProductAdd(product);
    setProductSearch("");
  };

  return (
    <div className="space-y-2">
      <Label>Add Products</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products to add..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      {productSearch && products.length > 0 && (
        <div className="border rounded-md max-h-32 overflow-y-auto">
          {products.slice(0, 5).map((product) => (
            <div
              key={product.id}
              className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => handleProductSelect(product)}
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">
                SKU: {product.sku} • Stock: {product.stock} • ${product.price}
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
