import React, { useState } from "react";
import { useProducts, useDeleteProduct, useUpdateProduct, Product } from "@/services/useProducts";
import { EditProductForm } from "./EditProductForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarcodePrintDialog } from "./BarcodePrintDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash, Printer, Smartphone, Barcode, Package } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ProductRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onUpdate: any;
  isDeleting: boolean;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onUpdate: any;
  isDeleting: boolean;
}

function ProductCard({ product, onEdit, onDelete, onUpdate, isDeleting }: ProductCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 touch-target border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-4 md:pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="p-3 md:p-4 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl">
              <Smartphone className="h-7 w-7 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl md:text-2xl text-on-surface truncate leading-tight">
                {product.brand} {product.model}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm md:text-base text-muted-foreground font-mono">
                  {product.serial_numbers?.[0] || product.id.slice(0, 8)}
                </p>
                {product.year && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Anno: {product.year}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Stock Badge */}
          <Badge 
            variant={product.stock <= product.threshold ? "destructive" : "default"}
            className="text-sm md:text-base font-semibold px-3 py-1"
          >
            {product.stock} pz
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-5 md:space-y-6">
        {/* Key Information Grid - Better spacing for tablets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Categoria</p>
            <p className="text-base md:text-lg font-medium text-on-surface">
              {product.category_name || product.category?.name || 'N/A'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Batteria</p>
            <div>
              {product.battery_level ? (
                <Badge 
                  variant={product.battery_level > 80 ? "default" : product.battery_level > 50 ? "secondary" : "destructive"}
                  className="text-sm md:text-base font-semibold px-3 py-1"
                >
                  {product.battery_level}%
                </Badge>
              ) : (
                <span className="text-base text-muted-foreground">N/A</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Prezzo</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl md:text-3xl font-bold text-primary">
                €{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
              </p>
              {/* Barcode indicator */}
              {product.barcode && (
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Barcode className="h-6 w-6 text-secondary" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Improved tablet layout */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-4 border-t">
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
                variant="default" 
                size="lg"
                className="flex-1 md:flex-none touch-button h-12 md:h-11 text-base font-medium"
                title={product.barcode ? "Stampa Etichetta Prodotto" : "Genera Codice a Barre & Stampa"}
              >
                <Printer className="h-5 w-5 mr-3" />
                Stampa Etichetta
              </Button>
            }
          />
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="lg"
              className="flex-1 md:flex-none touch-button h-12 md:h-11 text-base font-medium"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-5 w-5 mr-2" />
              Modifica
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 touch-button h-12 md:h-11 text-base font-medium"
                  disabled={isDeleting}
                >
                  <Trash className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Elimina Prodotto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler eliminare "{product.brand} {product.model}"? Questa azione non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(product)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductRow({ product, onEdit, onDelete, onUpdate, isDeleting }: ProductRowProps) {
  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-surface-container-high transition-colors">
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
        <div className="font-mono text-sm text-on-surface truncate">
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
  );
}

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
    <>
      {/* Desktop Table Layout */}
      <div className="bg-surface rounded-xl border border-outline overflow-hidden hidden lg:block">
        {/* Table Header */}
        <div className="bg-surface-container border-b border-outline">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-on-surface-variant">
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

      {/* Tablet/Mobile Card Layout */}
      <div className="lg:hidden grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-1 xl:grid-cols-2">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onUpdate={updateProduct}
            isDeleting={deleteProduct.isPending}
          />
        ))}
      </div>
    </>
  );
}
