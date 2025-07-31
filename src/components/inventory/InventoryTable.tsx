import React, { useState, memo } from "react";
import { useProducts, useDeleteProduct, useUpdateProduct, Product } from "@/services/useProducts";
import { EditProductForm } from "./EditProductForm";
import { Badge } from "@/components/ui/badge";
import { BarcodePrintDialog } from "./BarcodePrintDialog";
import { Edit, Trash, Printer, Smartphone, Barcode } from "lucide-react";
import { DataCard, DataTable, ConfirmDialog, useConfirmDialog, LoadingState, EmptyState } from "@/components/common";

export function InventoryTable({ searchTerm = "", viewMode = "list" }: { searchTerm?: string; viewMode?: "list" | "grid" }) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { dialogState, showConfirmDialog, hideConfirmDialog, confirmAction } = useConfirmDialog<Product>();
  
  const { data: products, isLoading, error } = useProducts(searchTerm);
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDeleteProduct = (product: Product) => {
    showConfirmDialog({
      item: product,
      title: "Delete Product",
      message: `Are you sure you want to delete "${product.brand} ${product.model}"? This action cannot be undone.`,
      onConfirm: () => deleteProduct.mutate(product.id)
    });
  };

  if (isLoading) {
    return <LoadingState message="Loading products..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load products"
        description="Please try again later."
        variant="card"
      />
    );
  }

  if (editingProduct) {
    return (
      <EditProductForm
        product={editingProduct}
        open={true}
        onClose={() => setEditingProduct(null)}
        onSuccess={() => setEditingProduct(null)}
      />
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Add your first product to get started."
        variant="card"
      />
    );
  }

  // Define table columns for desktop view
  const columns = [
    {
      key: 'brand' as keyof Product,
      header: 'Brand',
      render: (value: string) => <div className="font-medium truncate">{value}</div>
    },
    {
      key: 'model' as keyof Product,
      header: 'Model', 
      render: (value: string) => <div className="font-medium truncate">{value}</div>
    },
    {
      key: 'year' as keyof Product,
      header: 'Year',
      render: (value: number) => value || 'N/A'
    },
    {
      key: 'serial_numbers' as keyof Product,
      header: 'Serial/IMEI',
      render: (value: string[], product: Product) => (
        <div className="font-mono text-sm truncate">
          {value?.[0] || product.id.slice(0, 8)}
        </div>
      )
    },
    {
      key: 'category_name' as keyof Product,
      header: 'Category',
      render: (value: string, product: Product) => value || product.category?.name || '-'
    },
    {
      key: 'price' as keyof Product,
      header: 'Price',
      align: 'right' as const,
      render: (value: number) => (
        <div className="font-medium">
          €{typeof value === 'number' ? value.toFixed(2) : value}
        </div>
      )
    },
    {
      key: 'stock' as keyof Product,
      header: 'Stock',
      align: 'right' as const,
      render: (value: number, product: Product) => (
        <Badge variant={value <= product.threshold ? "destructive" : "outline"}>
          {value}
        </Badge>
      )
    }
  ];

  // Define actions for both table and cards
  const actions = [
    {
      icon: <Printer className="h-4 w-4" />,
      label: "Print",
      onClick: (product: Product) => {
        // This will be handled by the BarcodePrintDialog component
      },
      renderCustom: (product: Product) => (
        <BarcodePrintDialog
          productName={`${product.brand} ${product.model}`}
          barcode={product.barcode || undefined}
          price={product.price}
          specifications={product.description}
          serialNumbers={product.serial_numbers}
          onBarcodeGenerated={(newBarcode) => {
            updateProduct.mutate({
              id: product.id,
              product: { barcode: newBarcode }
            });
          }}
          trigger={
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
              <Printer className="h-4 w-4" />
            </button>
          }
        />
      )
    },
    {
      icon: <Edit className="h-4 w-4" />,
      label: "Edit",
      onClick: handleEditProduct
    },
    {
      icon: <Trash className="h-4 w-4" />,
      label: "Delete", 
      onClick: handleDeleteProduct,
      variant: "destructive" as const
    }
  ];

  return (
    <>
      {/* Desktop Table Layout */}
      <div className="hidden lg:block">
        <DataTable
          data={products}
          columns={columns}
          actions={actions} // Include all actions including print
          getRowKey={(product) => product.id}
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-1 xl:grid-cols-2">
        {products.map((product) => (
          <DataCard
            key={product.id}
            title={`${product.brand} ${product.model}`}
            subtitle={product.serial_numbers?.[0] || product.id.slice(0, 8)}
            icon={<Smartphone className="h-5 w-5 text-primary" />}
            badge={{
              text: product.stock.toString(),
              variant: product.stock <= product.threshold ? "destructive" : "default"
            }}
            fields={[
              {
                label: "Category",
                value: product.category_name || product.category?.name || 'N/A'
              },
              {
                label: "Price",
                value: <span className="text-base font-bold text-primary">
                  €{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                </span>,
                className: "col-span-full"
              }
            ]}
            actions={[
              {
                icon: <BarcodePrintDialog
                  productName={`${product.brand} ${product.model}`}
                  barcode={product.barcode || undefined}
                  price={product.price}
                  specifications={product.description}
                  serialNumbers={product.serial_numbers}
                  onBarcodeGenerated={(newBarcode) => {
                    updateProduct.mutate({
                      id: product.id,
                      product: { barcode: newBarcode }
                    });
                  }}
                  trigger={
                     <div className="flex items-center justify-center p-2 rounded-md bg-green-100 hover:bg-green-200 transition-colors">
                       <Printer className="h-4 w-4 text-green-700" />
                     </div>
                  }
                />,
                label: "Print",
                onClick: () => {},
                className: "p-0 w-auto h-auto bg-transparent hover:bg-transparent"
              },
              {
                icon: <Edit className="h-3 w-3 mr-1" />,
                label: "Edit",
                onClick: () => handleEditProduct(product)
              },
              {
                icon: <Trash className="h-3 w-3 mr-1" />,
                label: "Delete",
                onClick: () => handleDeleteProduct(product),
                variant: "outline",
                className: "text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              }
            ]}
          />
        ))}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={dialogState.isOpen}
        onClose={hideConfirmDialog}
        onConfirm={confirmAction}
        title={dialogState.title}
        message={dialogState.message}
        variant="destructive"
        confirmText="Delete"
      />
    </>
  );
}

export default memo(InventoryTable);
