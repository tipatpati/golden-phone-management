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
      {/* Table Header - Hidden on mobile */}
      <div className="bg-surface-container border-b border-outline hidden md:block">
        <div className="grid grid-cols-12 gap-2 lg:gap-4 px-3 lg:px-4 py-3 text-sm font-medium text-on-surface-variant">
          <div className="col-span-2">Brand</div>
          <div className="col-span-2">Model</div>
          <div className="col-span-1">Year</div>
          <div className="col-span-1">Serial/IMEI</div>
          <div className="col-span-1">Battery</div>
          <div className="col-span-1">Category</div>
          <div className="col-span-1 text-right">Price</div>
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
    <>
      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-2 lg:gap-4 px-3 lg:px-4 py-3 hover:bg-surface-container-high transition-colors">
        {/* Brand */}
        <div className="col-span-2">
          <div className="font-medium text-on-surface truncate">{product.brand}</div>
        </div>

        {/* Model */}
        <div className="col-span-2">
          <div className="font-medium text-on-surface truncate">{product.model}</div>
        </div>

        {/* Year */}
        <div className="col-span-1">
          <div className="text-on-surface text-sm truncate">{product.year || 'N/A'}</div>
        </div>

        {/* Serial/IMEI */}
        <div className="col-span-1">
          <div className="font-mono text-xs lg:text-sm text-on-surface truncate">
            {product.serial_numbers?.[0] || product.id.slice(0, 8)}
          </div>
        </div>

        {/* Battery Level */}
        <div className="col-span-1">
          <div className="text-on-surface text-sm">
            {product.battery_level ? (
              <Badge variant={product.battery_level > 80 ? "outline" : product.battery_level > 50 ? "secondary" : "destructive"}>
                {product.battery_level}%
              </Badge>
            ) : (
              <span className="text-muted-foreground">N/A</span>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="col-span-1">
          <span className="text-on-surface text-sm truncate">{product.category_name || product.category?.name}</span>
        </div>

        {/* Price */}
        <div className="col-span-1 text-right">
          <div className="font-medium text-on-surface text-sm">
            €{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
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
            productName={`${product.brand} ${product.model}`}
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
                  Are you sure you want to delete "{product.brand} {product.model}"? This action cannot be undone.
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

      {/* Mobile Layout */}
      <div className="md:hidden p-4 hover:bg-surface-container-high transition-colors">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-on-surface text-base truncate">{product.brand} {product.model}</h3>
            <p className="text-sm text-on-surface-variant font-mono mt-1">
              {product.serial_numbers?.[0] || product.id.slice(0, 8)}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <BarcodePrintDialog
              productName={`${product.brand} ${product.model}`}
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
                    Are you sure you want to delete "{product.brand} {product.model}"? This action cannot be undone.
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
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-on-surface-variant">Year:</span>
            <p className="text-on-surface font-medium truncate">
              {product.year || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-on-surface-variant">Category:</span>
            <p className="text-on-surface font-medium truncate">
              {product.category_name || product.category?.name || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-on-surface-variant">Battery:</span>
            <div className="mt-1">
              {product.battery_level ? (
                <Badge variant={product.battery_level > 80 ? "outline" : product.battery_level > 50 ? "secondary" : "destructive"}>
                  {product.battery_level}%
                </Badge>
              ) : (
                <span className="text-muted-foreground">N/A</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-on-surface-variant">Price:</span>
            <p className="text-on-surface font-medium text-base">
              €{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
            </p>
          </div>
          <div>
            <span className="text-on-surface-variant">Stock:</span>
            <div className="mt-1">
              <Badge variant={product.stock <= product.threshold ? "destructive" : "outline"}>
                {product.stock}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}