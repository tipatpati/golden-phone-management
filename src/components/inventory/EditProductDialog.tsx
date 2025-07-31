import React from "react";
import { FormDialog } from "@/components/common/FormDialog";
import { ProductForm } from "./forms/ProductForm";
import { useUpdateProduct } from "@/services/products/ProductReactQueryService";
import { Product } from "@/services/products/types";
import { ProductFormData } from "./forms/types";
import { toast } from "@/components/ui/sonner";
import { log } from "@/utils/logger";

interface EditProductDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductDialog({ 
  product, 
  open, 
  onClose, 
  onSuccess 
}: EditProductDialogProps) {
  log.debug('EditProductDialog rendering', { productId: product.id }, 'EditProductDialog');
  
  const updateProduct = useUpdateProduct();
  const initialSerialCount = product.serial_numbers?.length || 0;

  const handleSubmit = async (data: ProductFormData) => {
    console.log('🔄 EditProductDialog handleSubmit called with data:', data);
    log.debug('Submitting product update', { 
      brand: data.brand, 
      model: data.model, 
      categoryId: data.category_id 
    }, 'EditProductDialog');
    
    try {
      const addedUnits = data.has_serial 
        ? Math.max(0, (data.serial_numbers?.length || 0) - initialSerialCount) 
        : 0;
        
      const updatedProduct = {
        brand: data.brand,
        model: data.model,
        year: data.year,
        category_id: data.category_id,
        price: data.price,
        min_price: data.min_price,
        max_price: data.max_price,
        stock: data.stock,
        threshold: data.threshold,
        description: data.description || undefined,
        supplier: data.supplier || undefined,
        barcode: data.barcode || undefined,
        has_serial: data.has_serial,
        serial_numbers: data.has_serial ? data.serial_numbers : undefined,
      };

      await updateProduct.mutateAsync({ 
        id: product.id, 
        data: updatedProduct 
      });
      
      if (addedUnits > 0) {
        toast.success(`Product updated successfully! Added ${addedUnits} new units. Total stock: ${data.stock}`);
      } else {
        toast.success("Product updated successfully!");
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      log.error('Product update failed', error, 'EditProductDialog');
    }
  };

  const initialData: Partial<ProductFormData> = {
    brand: product.brand || "",
    model: product.model || "",
    year: product.year,
    category_id: product.category_id,
    price: product.price,
    min_price: product.min_price,
    max_price: product.max_price,
    stock: product.stock,
    threshold: product.threshold,
    description: product.description || "",
    supplier: product.supplier || "",
    barcode: product.barcode || "",
    has_serial: product.has_serial || false,
    serial_numbers: product.serial_numbers || [],
  };

  return (
    <FormDialog
      title={`Edit Product: ${product.brand} ${product.model}`}
      open={open}
      onClose={onClose}
      isLoading={updateProduct.isPending}
      submitText="Update Product"
      maxWidth="xl"
    >
      <ProductForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={updateProduct.isPending}
        submitText="Update Product"
      />
    </FormDialog>
  );
}