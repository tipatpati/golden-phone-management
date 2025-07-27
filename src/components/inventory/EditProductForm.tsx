
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductFormFields, CATEGORY_OPTIONS } from "@/components/inventory/ProductFormFields";
import { useUpdateProduct, useCategories } from "@/services/useProducts";
import { Product } from "@/services/supabaseProducts";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { RefreshCw } from "lucide-react";

interface EditProductFormProps {
  product: Product;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EditProductForm({ product, onCancel, onSuccess }: EditProductFormProps) {
  console.log('EditProductForm rendering with product:', product);
  
  const [name, setName] = useState(product.name || "");
  const [categoryId, setCategoryId] = useState(product.category_id?.toString() || "");
  const [price, setPrice] = useState(product.price?.toString() || "");
  const [minPrice, setMinPrice] = useState(product.min_price?.toString() || "");
  const [maxPrice, setMaxPrice] = useState(product.max_price?.toString() || "");
  const [stock, setStock] = useState(product.stock?.toString() || "");
  const [threshold, setThreshold] = useState(product.threshold?.toString() || "");
  const [barcode, setBarcode] = useState(product.barcode || "");
  const [hasSerial, setHasSerial] = useState(product.has_serial || false);
  const [serialNumbers, setSerialNumbers] = useState<string>(
    product.serial_numbers ? product.serial_numbers.join('\n') : ""
  );
  // Extract IMEI/Serial from existing barcode or first serial number
  const [imeiSerial, setImeiSerial] = useState(() => {
    if (product.serial_numbers?.length > 0) {
      const { serial } = parseSerialWithBattery(product.serial_numbers[0]);
      return serial;
    }
    return "";
  });
  const [batteryLevel, setBatteryLevel] = useState(() => {
    if (product.serial_numbers?.length > 0) {
      const { batteryLevel } = parseSerialWithBattery(product.serial_numbers[0]);
      return batteryLevel?.toString() || "";
    }
    return "";
  });

  const updateProduct = useUpdateProduct();
  const { data: categories } = useCategories();

  // Auto-generate barcode when IMEI/Serial or battery changes
  useEffect(() => {
    if (imeiSerial.trim()) {
      const battery = batteryLevel ? parseInt(batteryLevel) : 0;
      const generatedBarcode = generateSKUBasedBarcode(imeiSerial.trim(), product.id, battery);
      setBarcode(generatedBarcode);
    }
  }, [imeiSerial, batteryLevel, product.id]);

  const generateNewBarcode = () => {
    if (!imeiSerial.trim()) {
      toast.error("Please enter IMEI/Serial number first");
      return;
    }

    const battery = batteryLevel ? parseInt(batteryLevel) : 0;
    
    // Validate battery level if provided
    if (batteryLevel && (isNaN(battery!) || battery! < 0 || battery! > 100)) {
      toast.error("Battery level must be between 0-100");
      return;
    }

    const newBarcode = generateSKUBasedBarcode(imeiSerial.trim(), product.id, battery);
    setBarcode(newBarcode);
    toast.success("New barcode generated");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', { name, categoryId, price, stock, threshold });
    
    // Mandatory IMEI/Serial validation
    if (!imeiSerial.trim()) {
      toast.error("IMEI/Serial number is required for barcode generation");
      return;
    }

    // Validate battery level if provided
    if (batteryLevel && (isNaN(parseInt(batteryLevel)) || parseInt(batteryLevel) < 0 || parseInt(batteryLevel) > 100)) {
      toast.error("Battery level must be between 0-100");
      return;
    }

    // Validate that a barcode exists
    if (!barcode) {
      toast.error("Barcode is required and must be generated from IMEI/Serial number");
      return;
    }
    
    // Validate serial numbers with battery levels if they exist
    if (hasSerial && serialNumbers.trim()) {
      const serialArray = serialNumbers.split('\n').map(s => s.trim()).filter(s => s !== "");
      
      for (const serial of serialArray) {
        const parts = serial.split(/\s+/);
        if (parts.length >= 2) {
          const batteryLevel = parseInt(parts[parts.length - 1]);
          if (isNaN(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) {
            toast.error(`Invalid battery level for "${serial}". Battery level must be between 0-100.`);
            return;
          }
        }
      }
    }
    
    try {
      const serialArray = hasSerial && serialNumbers.trim() 
        ? serialNumbers.split('\n').map(s => s.trim()).filter(s => s !== "") 
        : [];
        
      const updatedProduct = {
        name,
        category_id: parseInt(categoryId),
        price: parseFloat(price),
        min_price: parseFloat(minPrice),
        max_price: parseFloat(maxPrice),
        stock: parseInt(stock),
        threshold: parseInt(threshold),
        barcode: barcode || undefined,
        has_serial: hasSerial,
        serial_numbers: hasSerial ? serialArray : undefined,
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

  console.log('Rendering form with state:', { name, categoryId, price, stock, threshold });

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
              categories={categories}
            />
            
            {hasSerial && (
              <div className="space-y-2">
                <Label htmlFor="serial-numbers">
                  IMEI/Serial Numbers with Battery Level (One per line)
                </Label>
                <Textarea 
                  id="serial-numbers"
                  value={serialNumbers}
                  onChange={(e) => setSerialNumbers(e.target.value)}
                  placeholder="352908764123456 85&#10;352908764123457 92&#10;352908764123458 78"
                  className="h-32"
                />
                <p className="text-xs text-muted-foreground">
                  Format: IMEI/Serial followed by battery level (e.g., "352908764123456 85")
                </p>
              </div>
            )}
            
            {/* Barcode Section */}
            {barcode && (
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Product Barcode</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateNewBarcode}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
                <div className="flex justify-center">
                  <BarcodeGenerator value={barcode} />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Barcode: {barcode}
                </p>
              </div>
            )}
            
            {!barcode && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 mb-2">
                  This product doesn't have a barcode yet.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateNewBarcode}
                >
                  Generate Barcode
                </Button>
              </div>
            )}
            
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
