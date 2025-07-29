
import React, { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProducts, useDeleteProduct, useUpdateProduct } from "@/services/useProducts";
import { Product } from "@/services/supabaseProducts";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Barcode, Smartphone, Printer } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { EditProductForm } from "@/components/inventory/EditProductForm";
import { BarcodePrintDialog } from "@/components/inventory/BarcodePrintDialog";
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

interface InventoryTableProps {
  searchTerm?: string;
  viewMode?: "list" | "grid";
}

export function InventoryTable({ searchTerm = "", viewMode = "list" }: InventoryTableProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Use our Supabase API hook to fetch products with search
  const { data: products, isLoading, isError } = useProducts(searchTerm);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  
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
      <div className="rounded-xl border overflow-hidden md-elevation-1 md-elevation-smooth hover:md-elevation-2">
        <Table className="w-full">
          <TableHeader>
            <TableRow interactive={false}>
              <TableHead sortable sortDirection={null} className="md-focus-smooth pl-0">Product</TableHead>
              <TableHead className="md-focus-smooth">Serial/IMEI</TableHead>
              <TableHead className="hidden sm:table-cell md-focus-smooth">Category</TableHead>
              <TableHead className="hidden md:table-cell md-focus-smooth">Type</TableHead>
              <TableHead align="right" sortable className="hidden sm:table-cell md-focus-smooth">Price</TableHead>
              <TableHead align="right" sortable className="md-focus-smooth">Stock</TableHead>
              <TableHead align="right" className="md-focus-smooth">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => (
              <ProductRow 
                key={product.id} 
                product={product} 
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onUpdate={updateProduct}
                isDeleting={deleteProduct.isPending}
              />
            ))}
          </TableBody>
        </Table>
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
  onUpdate,
  isDeleting 
}: { 
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onUpdate: any;
  isDeleting: boolean;
}) {
  return (
    <TableRow className="md-interactive-smooth md-focus-smooth">{/* Row has exactly 7 cells */}
      <TableCell className="font-medium md-motion-smooth pl-0">
        <div className="flex flex-col gap-1">
          <div className="truncate max-w-[120px] sm:max-w-none">{product.name}</div>
          <div className="text-xs text-muted-foreground sm:hidden">
            ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="truncate max-w-[100px] font-mono text-xs sm:text-sm">
            {product.serial_numbers?.[0] || product.id.slice(0, 8)}
          </div>
          <div className="text-xs text-muted-foreground sm:hidden">
            Stock: {product.stock}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <span>{product.category_name || product.category?.name}</span>
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
      <TableCell align="right" className="hidden sm:table-cell">
        <div className="font-medium">
          ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
        </div>
      </TableCell>
      <TableCell align="right">
        <Badge variant={product.stock <= product.threshold ? "destructive" : "outline"}>
          {product.stock}
        </Badge>
      </TableCell>
      <TableCell align="right">
        <div className="flex justify-end items-center gap-1 sm:gap-2">
          <BarcodePrintDialog
            productName={product.name}
            barcode={product.barcode || undefined}
            price={product.price}
            specifications={product.description}
            serialNumbers={product.serial_numbers}
            onBarcodeGenerated={(newBarcode) => {
              // Update the product with the new barcode - only send necessary fields
              onUpdate.mutate({
                id: product.id,
                product: { barcode: newBarcode }
              });
            }}
            trigger={
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center md-interactive-smooth md-focus-smooth"
                title={product.barcode ? "Print Product Sticker" : "Generate Barcode & Print Sticker"}
              >
                <Printer className="h-3 w-3" />
              </Button>
            }
          />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center md-interactive-smooth md-focus-smooth"
            onClick={() => onEdit(product)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center md-interactive-smooth md-focus-smooth"
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
