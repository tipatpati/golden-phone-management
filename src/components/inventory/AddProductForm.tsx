
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Add the Badge import
import { useCreateProduct } from "@/services/useProducts";
import { toast } from "@/components/ui/sonner";
import { Smartphone, Barcode } from "lucide-react";

export function AddProductForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Phones");
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
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      threshold: parseInt(threshold),
      description,
      has_serial: hasSerial,
      serial_numbers: serialArray,
      barcode: barcode || undefined
    };
    
    createProduct.mutate(newProduct, {
      onSuccess: () => {
        toast.success("Product added successfully");
        onCancel(); // Close form on success
      },
      onError: (error) => {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch 
                id="has-serial"
                checked={hasSerial}
                onCheckedChange={setHasSerial}
              />
              <Label htmlFor="has-serial">Product has IMEI/Serial Numbers</Label>
            </div>
            <Badge variant={hasSerial ? "default" : "outline"} className="text-xs">
              {hasSerial ? "Phone/Device" : "Accessory"}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input 
                id="product-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="iPhone 13 Pro" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-sku">SKU *</Label>
              <Input 
                id="product-sku" 
                value={sku} 
                onChange={(e) => setSku(e.target.value)} 
                placeholder="PHN-IP13P-256-GRY" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-category">Category *</Label>
              <select 
                id="product-category"
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="Phones">Phones</option>
                <option value="Accessories">Accessories</option>
                <option value="Spare Parts">Spare Parts</option>
                <option value="Protection">Protection</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-price">Price (€) *</Label>
              <Input 
                id="product-price" 
                type="number" 
                step="0.01" 
                min="0" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                placeholder="899.99" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-stock">Initial Stock *</Label>
              <Input 
                id="product-stock" 
                type="number" 
                min="0" 
                value={stock} 
                onChange={(e) => setStock(e.target.value)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-threshold">Low Stock Threshold *</Label>
              <Input 
                id="product-threshold" 
                type="number" 
                min="0" 
                value={threshold} 
                onChange={(e) => setThreshold(e.target.value)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-barcode">Barcode (Optional)</Label>
              <Input 
                id="product-barcode" 
                value={barcode} 
                onChange={(e) => setBarcode(e.target.value)} 
                placeholder="8901234567890" 
              />
            </div>
          </div>
          
          {hasSerial && (
            <div className="space-y-2">
              <Label htmlFor="serial-numbers">
                IMEI/Serial Numbers * (One per line, must match stock quantity)
              </Label>
              <Textarea 
                id="serial-numbers"
                value={serialNumbers}
                onChange={(e) => setSerialNumbers(e.target.value)}
                placeholder="352908764123456&#10;352908764123457"
                className="h-24"
              />
              <p className="text-xs text-muted-foreground">
                Enter {stock} IMEI/Serial numbers, one per line
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="product-description">Description (Optional)</Label>
            <Textarea 
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description"
              className="h-20"
            />
          </div>
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
