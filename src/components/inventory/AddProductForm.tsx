
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateProduct } from "@/services/useProducts";
import { toast } from "@/components/ui/sonner";
import { Smartphone, Barcode, RefreshCw, Printer } from "lucide-react";
import { ProductTypeSwitch } from "./ProductTypeSwitch";
import { ProductFormFields, CATEGORY_OPTIONS } from "./ProductFormFields";
import { SerialNumbersInput } from "./SerialNumbersInput";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { BarcodePrintDialog } from "./BarcodePrintDialog";

export function AddProductForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [threshold, setThreshold] = useState("5");
  const [description, setDescription] = useState("");
  const [hasSerial, setHasSerial] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imeiSerial, setImeiSerial] = useState(""); // Required for all products
  const [batteryLevel, setBatteryLevel] = useState(""); // Optional battery level
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const createProduct = useCreateProduct();

  // Generate barcode when IMEI/Serial or battery level changes
  React.useEffect(() => {
    if (imeiSerial.trim()) {
      const battery = batteryLevel ? parseInt(batteryLevel) : undefined;
      const generatedBarcode = generateSKUBasedBarcode(imeiSerial.trim(), undefined, battery);
      setBarcode(generatedBarcode);
    } else {
      setBarcode("");
    }
  }, [imeiSerial, batteryLevel]);

  const generateNewBarcode = () => {
    if (!imeiSerial.trim()) {
      toast.error("Please enter IMEI/Serial number first");
      return;
    }

    const battery = batteryLevel ? parseInt(batteryLevel) : undefined;
    
    // Validate battery level if provided
    if (batteryLevel && (isNaN(battery!) || battery! < 0 || battery! > 100)) {
      toast.error("Battery level must be between 0-100");
      return;
    }

    const newBarcode = generateSKUBasedBarcode(imeiSerial.trim(), undefined, battery);
    setBarcode(newBarcode);
    toast.success("New barcode generated");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!name || !category || !price || !minPrice || !maxPrice || !stock || !threshold) {
      toast.error("Please fill in all required fields");
      return;
    }

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
    
    // Validate price range
    const priceNum = parseFloat(price);
    const minPriceNum = parseFloat(minPrice);
    const maxPriceNum = parseFloat(maxPrice);
    
    if (minPriceNum >= maxPriceNum) {
      toast.error("Minimum price must be less than maximum price");
      return;
    }
    
    if (priceNum < minPriceNum || priceNum > maxPriceNum) {
      toast.error("Base price must be between minimum and maximum selling prices");
      return;
    }
    
    // Validate that a barcode has been generated
    if (!barcode) {
      toast.error("Barcode is required and must be generated from IMEI/Serial number");
      return;
    }
    
    // For products with serial tracking, build the serial array with battery info
    const serialArray = hasSerial && serialNumbers.trim()
      ? serialNumbers.split('\n').map(s => s.trim()).filter(s => s !== "") 
      : [];
      
    // For products with serial tracking, ensure serial numbers match stock
    if (hasSerial && serialArray.length !== parseInt(stock)) {
      toast.error(`Number of IMEI/serial numbers (${serialArray.length}) must match stock quantity (${stock})`);
      return;
    }
    
    const newProduct = {
      name,
      category_id: parseInt(category),
      price: parseFloat(price),
      min_price: parseFloat(minPrice),
      max_price: parseFloat(maxPrice),
      stock: parseInt(stock),
      threshold: parseInt(threshold),
      description,
      has_serial: hasSerial,
      serial_numbers: serialArray,
      barcode: barcode // Mandatory barcode generated from IMEI/Serial
    };
    
    console.log('Submitting product with category ID:', newProduct.category_id);
    
    createProduct.mutate(newProduct, {
      onSuccess: (data) => {
        toast.success("Product added successfully");
        setCreatedProduct({ ...newProduct, id: data?.id });
        setShowPrintDialog(true);
      },
      onError: (error) => {
        console.error('Product creation failed:', error);
        toast.error(`Failed to add product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  const handlePrintDialogClose = () => {
    setShowPrintDialog(false);
    setCreatedProduct(null);
    onCancel(); // Close the form after printing
  };

  return (
    <>
      {showPrintDialog && createdProduct && (
        <BarcodePrintDialog
          productName={createdProduct.name}
          barcode={createdProduct.barcode}
          price={createdProduct.price}
          trigger={
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-background p-6 rounded-lg shadow-lg border max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Product Created Successfully!</h3>
                <div className="text-center mb-4">
                  <BarcodeGenerator value={createdProduct.barcode} />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Would you like to print barcode labels for this product?
                </p>
                <div className="flex gap-2">
                  <Button onClick={handlePrintDialogClose} variant="outline" className="flex-1">
                    Skip
                  </Button>
                  <Button onClick={() => {}} className="flex-1">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Labels
                  </Button>
                </div>
              </div>
            </div>
          }
        />
      )}
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
            category={category}
            setCategory={setCategory}
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
            serialNumbers={serialNumbers.split('\n').filter(s => s.trim())}
            setSerialNumbers={(nums) => setSerialNumbers(nums.join('\n'))}
            imeiSerial={imeiSerial}
            setImeiSerial={setImeiSerial}
            batteryLevel={batteryLevel}
            setBatteryLevel={setBatteryLevel}
          />
          
          {hasSerial && (
            <SerialNumbersInput
              serialNumbers={serialNumbers}
              setSerialNumbers={setSerialNumbers}
              stock={stock}
            />
          )}
          
          {/* Barcode Section */}
          {barcode && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Generated Barcode</h4>
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
    </>
  );
}
