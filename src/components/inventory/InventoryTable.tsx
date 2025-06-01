
import React, { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProducts, Product, useDeleteProduct } from "@/services/useProducts";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Barcode, Smartphone } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { EditProductForm } from "@/components/inventory/EditProductForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Use our API hook to fetch products
  const { data: products, isLoading, isError } = useProducts();
  const deleteProduct = useDeleteProduct();
  
  console.log('InventoryTable render - editingProduct:', editingProduct);
  
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

  const handleEditProduct = (product: Product) => {
    console.log('Edit product clicked:', product);
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    console.log('Cancel edit clicked');
    setEditingProduct(null);
  };

  const handleEditSuccess = () => {
    console.log('Edit success');
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success(`${product.name} deleted successfully`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete ${product.name}`, {
        description: "Please try again later"
      });
    }
  };

  // If editing a product, show the edit form
  if (editingProduct) {
    console.log('Rendering EditProductForm for:', editingProduct);
    return (
      <div className="w-full">
        <EditProductForm 
          product={editingProduct}
          onCancel={handleCancelEdit}
          onSuccess={handleEditSuccess}
        />
      </div>
    );
  }

  console.log('Rendering inventory table');
  return (
    <div className="w-full">
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px] whitespace-nowrap">Product</TableHead>
                <TableHead className="min-w-[100px] whitespace-nowrap">SKU</TableHead>
                <TableHead className="hidden sm:table-cell min-w-[80px] whitespace-nowrap">Category</TableHead>
                <TableHead className="hidden md:table-cell min-w-[80px] whitespace-nowrap">Type</TableHead>
                <TableHead className="text-right min-w-[80px] whitespace-nowrap">Price</TableHead>
                <TableHead className="text-right min-w-[60px] whitespace-nowrap">Stock</TableHead>
                <TableHead className="text-right min-w-[100px] whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* If products is undefined or empty, show demo products */}
              {(!products || products.length === 0) ? demoProducts.map((product) => (
                <ProductRow 
                  key={product.id} 
                  product={product} 
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  isDeleting={deleteProduct.isPending}
                />
              )) : products.map((product) => (
                <ProductRow 
                  key={product.id} 
                  product={product} 
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  isDeleting={deleteProduct.isPending}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ 
  product, 
  onEdit, 
  onDelete,
  isDeleting 
}: { 
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  isDeleting: boolean;
}) {
  return (
    <TableRow key={product.id}>
      <TableCell className="font-medium">
        <div className="truncate max-w-[120px] text-sm">{product.name}</div>
      </TableCell>
      <TableCell>
        <div className="truncate max-w-[100px] text-xs font-mono">{product.sku}</div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <span className="text-sm">{product.category_name || product.category}</span>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {product.has_serial ? (
          <Badge variant="secondary" className="flex items-center gap-1 text-xs w-fit">
            <Smartphone className="h-3 w-3" />
            <span className="hidden lg:inline">IMEI</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1 text-xs w-fit">
            <Barcode className="h-3 w-3" />
            <span className="hidden lg:inline">Standard</span>
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="text-sm font-medium">
          ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant={product.stock <= product.threshold ? "destructive" : "outline"} className="text-xs">
          {product.stock}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 flex items-center justify-center"
            onClick={() => onEdit(product)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 flex items-center justify-center"
                disabled={isDeleting}
              >
                <Trash className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(product)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}
