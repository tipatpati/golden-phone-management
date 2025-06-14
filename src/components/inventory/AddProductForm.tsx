
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateProduct } from "@/services/useProducts";
import { toast } from "@/components/ui/sonner";
import { Smartphone, Barcode } from "lucide-react";
import { ProductTypeSwitch } from "./ProductTypeSwitch";
import { ProductFormFields, CATEGORY_OPTIONS } from "./ProductFormFields";
import { SerialNumbersInput } from "./SerialNumbersInput";

export function AddProductForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [threshold, setThreshold] = useState("5");
  const [description, setDescription] = useState("");
  const [hasSerial, setHasSerial] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState("");
  const [barcode, setBarcode] = useState("");

  const createProduct = useCreateProduct();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name || !sku || !category || !price || !stock || !threshold) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // If product has serial numbers, validate they are provided
    if (hasSerial && !serialNumbers.trim()) {
      toast.error("Please add at least one IMEI/serial number");
      return;
    }
    
    // Parse serial numbers into an array
    const serialArray = hasSerial 
      ? serialNumbers.split('\n').map(s => s.trim()).filter(s => s !== "") 
      : [];
      
    // Validate that number of serial numbers matches stock quantity
    if (hasSerial && serialArray.length !== parseInt(stock)) {
      toast.error(`Number of IMEI/serial numbers (${serialArray.length}) must match stock quantity (${stock})`);
      return;
    }
    
    const newProduct = {
      name,
      sku,
      category_id: parseInt(category), // Use category_id instead of category
      price: parseFloat(price),
      stock: parseInt(stock),
      threshold: parseInt(threshold),
      description,
      has_serial: hasSerial,
      serial_numbers: serialArray,
      barcode: barcode || undefined
    };
    
    console.log('Submitting product with category ID:', newProduct.category_id);
    
    createProduct.mutate(newProduct, {
      onSuccess: () => {
        toast.success("Product added successfully");
        onCancel(); // Close form on success
      },
      onError: (error) => {
        console.error('Product creation failed:', error);
        toast.error(`Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasSerial ? <Smartphone className="h-5 w-5" /> : <Barcode className="h-5 w-5" />}
          {hasSerial ? "Add Phone Product" : "Add Standard Product"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <ProductTypeSwitch 
            hasSerial={hasSerial} 
            setHasSerial={setHasSerial} 
          />
          
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
            hasSerial={hasSerial}
            setHasSerial={setHasSerial}
            serialNumbers={serialNumbers.split('\n').filter(s => s.trim())}
            setSerialNumbers={(nums) => setSerialNumbers(nums.join('\n'))}
          />
          
          {hasSerial && (
            <SerialNumbersInput
              serialNumbers={serialNumbers}
              setSerialNumbers={setSerialNumbers}
              stock={stock}
            />
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button 
            type="submit" 
            disabled={createProduct.isPending}
          >
            {createProduct.isPending ? "Adding..." : "Add Product"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
