
import React from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
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
    price: 999.99,
    stock: 15,
    threshold: 5,
  },
  {
    id: "2",
    name: "Samsung Galaxy S22",
    sku: "PHN-SGS22-256-BLK",
    category: "Phones",
    price: 899.99,
    stock: 3,
    threshold: 5,
  },
  {
    id: "3",
    name: "USB-C Cable",
    sku: "ACC-CBL-USBC-1M",
    category: "Accessories",
    price: 19.99,
    stock: 50,
    threshold: 20,
  },
];

export function InventoryTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demoProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="text-right">
                ${product.price.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                <Badge variant={product.stock <= product.threshold ? "destructive" : "outline"}>
                  {product.stock}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
