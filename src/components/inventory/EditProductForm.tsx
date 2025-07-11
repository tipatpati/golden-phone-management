
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ProductFormFields, CATEGORY_OPTIONS } from "@/components/inventory/ProductFormFields";
import { useUpdateProduct, useCategories } from "@/services/useProducts";
import { Product } from "@/services/supabaseProducts";
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
  const [categoryId, setCategoryId] = useState(product.category_id?.toString() || "");
  const [price, setPrice] = useState(product.price?.toString() || "");
  const [minPrice, setMinPrice] = useState(product.min_price?.toString() || "");
  const [maxPrice, setMaxPrice] = useState(product.max_price?.toString() || "");
  const [stock, setStock] = useState(product.stock?.toString() || "");
  const [threshold, setThreshold] = useState(product.threshold?.toString() || "");
  const [description, setDescription] = useState(product.description || "");
  const [barcode, setBarcode] = useState(product.barcode || "");
  const [hasSerial, setHasSerial] = useState(product.has_serial || false);
  const [serialNumbers, setSerialNumbers] = useState<string[]>(product.serial_numbers || []);

  const updateProduct = useUpdateProduct();
  const { data: categories } = useCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', { name, sku, categoryId, price, stock, threshold });
    
    try {
      const updatedProduct = {
        name,
        sku,
        category_id: parseInt(categoryId),
        price: parseFloat(price),
        min_price: parseFloat(minPrice),
        max_price: parseFloat(maxPrice),
        stock: parseInt(stock),
        threshold: parseInt(threshold),
        description: description || undefined,
        barcode: barcode || undefined,
        has_serial: hasSerial,
        serial_numbers: hasSerial ? serialNumbers : undefined,
      };

      await updateProduct.mutateAsync({ 
        id: product.id, 
        product: updatedProduct 
      });
      
      onSuccess();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  console.log('Rendering form with state:', { name, sku, categoryId, price, stock, threshold });

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
              category={categoryId}
              setCategory={setCategoryId}
              price={price}
              setPrice={setPrice}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              stock={stock}
              setStock={setStock}
              threshold={threshold}
              setThreshold={setThreshold}
              description={description}
              setDescription={setDescription}
              barcode={barcode}
              setBarcode={setBarcode}
              hasSerial={hasSerial}
              setHasSerial={setHasSerial}
              serialNumbers={serialNumbers}
              setSerialNumbers={setSerialNumbers}
              categories={categories}
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
