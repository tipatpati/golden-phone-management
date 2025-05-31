
import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product } from "@/services/useProducts";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Barcode, Smartphone } from "lucide-react";

const demoProducts: Product[] = [
  {
    id: "1",
    name: "iPhone 13 Pro",
    sku: "PHN-IP13P-256-GRY",
    category: "Phones",
    category_name: "Phones",
    price: 999.99,
    stock: 15,
    threshold: 5,
    has_serial: true,
    serial_numbers: ["352908764123456", "352908764123457"],
    barcode: "8901234567890"
  },
  {
    id: "2",
    name: "Samsung Galaxy S22",
    sku: "PHN-SGS22-256-BLK",
    category: "Phones",
    category_name: "Phones",
    price: 899.99,
    stock: 3,
    threshold: 5,
    has_serial: true,
    serial_numbers: ["990000862471854"],
    barcode: "8901234567891"
  },
  {
    id: "3",
    name: "USB-C Cable",
    sku: "ACC-CBL-USBC-1M",
    category: "Accessories",
    category_name: "Accessories",
    price: 19.99,
    stock: 50,
    threshold: 20,
    has_serial: false,
    barcode: "8901234567892"
  },
];

export function InventoryTable() {
  // Use our API hook to fetch products
  const { data: products, isLoading, isError } = useProducts();
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-muted-foreground">Loading inventory data...</p>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-destructive">Error loading inventory data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[120px]">Product</TableHead>
              <TableHead className="min-w-[100px]">SKU</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[80px]">Category</TableHead>
              <TableHead className="hidden md:table-cell min-w-[80px]">Type</TableHead>
              <TableHead className="text-right min-w-[80px]">Price</TableHead>
              <TableHead className="text-right min-w-[60px]">Stock</TableHead>
              <TableHead className="text-right min-w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* If products is undefined or empty, show demo products */}
            {(!products || products.length === 0) ? demoProducts.map((product) => (
              <ProductRow key={product.id} product={product} />
            )) : products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  return (
    <TableRow key={product.id}>
      <TableCell className="font-medium">
        <div className="truncate max-w-[120px]">{product.name}</div>
      </TableCell>
      <TableCell>
        <div className="truncate max-w-[100px] text-xs sm:text-sm">{product.sku}</div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{product.category_name || product.category}</TableCell>
      <TableCell className="hidden md:table-cell">
        {product.has_serial ? (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Smartphone className="h-3 w-3" />
            <span className="hidden lg:inline">IMEI</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Barcode className="h-3 w-3" />
            <span className="hidden lg:inline">Standard</span>
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="text-xs sm:text-sm">
          ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant={product.stock <= product.threshold ? "destructive" : "outline"} className="text-xs">
          {product.stock}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 touch-target">
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 touch-target">
            <Trash className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
