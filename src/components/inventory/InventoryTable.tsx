
import React, { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProducts, useDeleteProduct } from "@/services/useProducts";
import { Product } from "@/services/supabaseProducts";
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

export function InventoryTable() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Use our Supabase API hook to fetch products
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
    } catch (error) {
      console.error('Delete error:', error);
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
              {products?.map((product) => (
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
      
      {(!products || products.length === 0) && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No products found. Add your first product to get started.</p>
        </div>
      )}
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
