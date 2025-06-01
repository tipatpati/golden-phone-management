
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductFormFields, CATEGORY_OPTIONS } from "@/components/inventory/ProductFormFields";
import { useUpdateProduct, Product } from "@/services/useProducts";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditProductFormProps {
  product: Product;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EditProductForm({ product, onCancel, onSuccess }: EditProductFormProps) {
  console.log('EditProductForm rendering with product:', product);
  
  const [name, setName] = useState(product.name || "");
  const [sku, setSku] = useState(product.sku || "");
  const [category, setCategory] = useState(product.category?.toString() || "");
  const [price, setPrice] = useState(product.price?.toString() || "");
  const [stock, setStock] = useState(product.stock?.toString() || "");
  const [threshold, setThreshold] = useState(product.threshold?.toString() || "");
  const [description, setDescription] = useState(product.description || "");
  const [barcode, setBarcode] = useState(product.barcode || "");

  const updateProduct = useUpdateProduct();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', { name, sku, category, price, stock, threshold });
    
    try {
      const updatedProduct = {
        name,
        sku,
        category: parseInt(category),
        price: parseFloat(price),
        stock: parseInt(stock),
        threshold: parseInt(threshold),
        description: description || undefined,
        barcode: barcode || undefined,
      };

      await updateProduct.mutateAsync({ 
        id: product.id, 
        product: updatedProduct 
      });
      
      toast.success(`${name} updated successfully`);
      onSuccess();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to update ${name}`, {
        description: "Please try again later"
      });
    }
  };

  console.log('Rendering form with state:', { name, sku, category, price, stock, threshold });

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product: {product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ProductFormFields
              name={name}
              setName={setName}
              sku={sku}
              setSku={setSku}
              category={category}
              setCategory={setCategory}
              price={price}
              setPrice={setPrice}
              stock={stock}
              setStock={setStock}
              threshold={threshold}
              setThreshold={setThreshold}
              description={description}
              setDescription={setDescription}
              barcode={barcode}
              setBarcode={setBarcode}
            />
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={updateProduct.isPending}
                className="flex-1"
              >
                {updateProduct.isPending ? "Updating..." : "Update Product"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
