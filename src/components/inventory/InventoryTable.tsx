import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product } from "@/services/useProducts";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  category_name?: string;
  price: number;
  stock: number;
  threshold: number;
};

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
  );
}

function ProductRow({ product }: { product: Product }) {
  return (
    <TableRow key={product.id}>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>{product.sku}</TableCell>
      <TableCell>{product.category_name || product.category}</TableCell>
      <TableCell className="text-right">
        ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
      </TableCell>
      <TableCell className="text-right">
        <Badge variant={product.stock <= product.threshold ? "destructive" : "outline"}>
          {product.stock}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
