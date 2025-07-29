import React, { useState } from "react";
import { useProducts, useDeleteProduct, useUpdateProduct, Product } from "@/services/useProducts";
import { EditProductForm } from "./EditProductForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarcodePrintDialog } from "./BarcodePrintDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash, Printer, Smartphone, Barcode } from "lucide-react";

interface InventoryTableProps {
  searchTerm?: string;
  viewMode?: "list" | "grid";
}

export function InventoryTable({ searchTerm = "", viewMode = "list" }: InventoryTableProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const { data: products, isLoading, error } = useProducts(searchTerm);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleEditSuccess = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = (product: Product) => {
    deleteProduct.mutate(product.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load products. Please try again.</p>
      </div>
    );
  }

  if (editingProduct) {
    return (
      <EditProductForm
        product={editingProduct}
        onCancel={handleCancelEdit}
        onSuccess={handleEditSuccess}
      />
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found. Add your first product to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-outline overflow-hidden">
      {/* Table Header */}
      <div className="bg-surface-container border-b border-outline">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-on-surface-variant">
          <div className="col-span-3">Product</div>
          <div className="col-span-2">Serial/IMEI</div>
          <div className="col-span-2 hidden sm:block">Category</div>
          <div className="col-span-1 hidden md:block">Type</div>
          <div className="col-span-1 hidden sm:block text-right">Price</div>
          <div className="col-span-1 text-right">Stock</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-outline">
        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onUpdate={updateProduct}
            isDeleting={deleteProduct.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onUpdate: any;
  isDeleting: boolean;
}

function ProductRow({ product, onEdit, onDelete, onUpdate, isDeleting }: ProductRowProps) {
  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-surface-container-high transition-colors">
      {/* Product Name */}
      <div className="col-span-3">
        <div className="font-medium text-on-surface truncate">{product.name}</div>
        <div className="text-xs text-on-surface-variant sm:hidden">
          ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
        </div>
      </div>

      {/* Serial/IMEI */}
      <div className="col-span-2">
        <div className="font-mono text-xs text-on-surface truncate">
          {product.serial_numbers?.[0] || product.id.slice(0, 8)}
        </div>
        <div className="text-xs text-on-surface-variant sm:hidden">
          Stock: {product.stock}
        </div>
      </div>

      {/* Category */}
      <div className="col-span-2 hidden sm:block">
        <span className="text-on-surface">{product.category_name || product.category?.name}</span>
      </div>

      {/* Type */}
      <div className="col-span-1 hidden md:block">
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
      </div>

      {/* Price */}
      <div className="col-span-1 hidden sm:block text-right">
        <div className="font-medium text-on-surface">
          ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
        </div>
      </div>

      {/* Stock */}
      <div className="col-span-1 text-right">
        <Badge variant={product.stock <= product.threshold ? "destructive" : "outline"}>
          {product.stock}
        </Badge>
      </div>

      {/* Actions */}
      <div className="col-span-2 flex justify-end items-center gap-1">
        <BarcodePrintDialog
          productName={product.name}
          barcode={product.barcode || undefined}
          price={product.price}
          specifications={product.description}
          serialNumbers={product.serial_numbers}
          onBarcodeGenerated={(newBarcode) => {
            onUpdate.mutate({
              id: product.id,
              product: { barcode: newBarcode }
            });
          }}
          trigger={
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              title={product.barcode ? "Print Product Sticker" : "Generate Barcode & Print Sticker"}
            >
              <Printer className="h-4 w-4" />
            </Button>
          }
        />
        
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onEdit(product)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash className="h-4 w-4" />
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
    </div>
  );
}