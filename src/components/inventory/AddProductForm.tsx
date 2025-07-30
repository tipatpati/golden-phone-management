import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateProduct } from "@/services/useProducts";
import { toast } from "@/components/ui/sonner";
import { Smartphone, Barcode, RefreshCw, Printer } from "lucide-react";
import { ProductFormFields, CATEGORY_OPTIONS } from "./ProductFormFields";
import { SerialNumbersInput } from "./SerialNumbersInput";
import { generateSerialBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery, validateSerialWithBattery } from "@/utils/serialNumberUtils";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { BarcodePrintDialog } from "./BarcodePrintDialog";

export function AddProductForm({ onCancel }: { onCancel: () => void }) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [threshold, setThreshold] = useState("5");
  const [batteryLevel, setBatteryLevel] = useState("85");
  const [serialNumbers, setSerialNumbers] = useState("");
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const createProduct = useCreateProduct();

  // Check if category requires serial numbers (accessories are optional)
  const requiresSerial = category !== "2"; // Accessories category ID is 2

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!brand || !model || !category || !price || !minPrice || !maxPrice || !threshold) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    // Parse serial numbers with battery and color
    const serialLines = serialNumbers.split('\n').map(line => line.trim()).filter(line => line !== "");
    
    // For categories that require serials, validate them
    if (requiresSerial && serialLines.length === 0) {
      toast.error("Questa categoria di prodotto richiede numeri IMEI/Seriali");
      return;
    }

    // Validate each serial line
    for (const line of serialLines) {
      const validation = validateSerialWithBattery(line);
      if (!validation.isValid) {
        toast.error(`Invalid format in line "${line}": ${validation.error}`);
        return;
      }
    }
    
    // Validate price range
    const priceNum = parseFloat(price);
    const minPriceNum = parseFloat(minPrice);
    const maxPriceNum = parseFloat(maxPrice);
    
    if (minPriceNum >= maxPriceNum) {
      toast.error("Il prezzo minimo deve essere inferiore al prezzo massimo");
      return;
    }
    
    if (priceNum < minPriceNum || priceNum > maxPriceNum) {
      toast.error("Il prezzo base deve essere compreso tra i prezzi minimi e massimi di vendita");
      return;
    }
    
    // Parse serial entries and generate individual barcodes
    const serialEntries = serialLines.map(line => {
      const parsed = parseSerialWithBattery(line);
      const barcode = generateSerialBasedBarcode(parsed.serial, undefined, parsed.batteryLevel);
      return {
        serial: parsed.serial,
        batteryLevel: parsed.batteryLevel,
        color: parsed.color,
        barcode: barcode
      };
    });

    // Collect colors for product name enhancement
    const colors = [...new Set(serialEntries.map(entry => entry.color).filter(Boolean))];
    const enhancedBrand = colors.length > 0 ? `${brand} (${colors.join(', ')})` : brand;
    
    // Set stock to match number of serial entries (each serial = 1 unit of stock)
    const actualStock = serialEntries.length > 0 ? serialEntries.length : parseInt(stock);
    
    const newProduct = {
      brand: enhancedBrand,
      model,
      year: year ? parseInt(year) : undefined,
      category_id: parseInt(category),
      price: parseFloat(price),
      min_price: parseFloat(minPrice),
      max_price: parseFloat(maxPrice),
      stock: actualStock, // Stock matches serial entries count
      threshold: parseInt(threshold),
      battery_level: batteryLevel ? parseInt(batteryLevel) : undefined, // Default battery level for category
      has_serial: serialEntries.length > 0,
      serial_numbers: serialEntries.map(entry => 
        `${entry.serial}${entry.batteryLevel ? ` ${entry.batteryLevel}` : ''}${entry.color ? ` ${entry.color}` : ''}`
      ),
      barcode: serialEntries.length > 0 ? serialEntries[0].barcode : generateSerialBasedBarcode(`${brand} ${model}`, undefined, 0),
      serial_entries: serialEntries // Store individual entries for inventory tracking
    };
    
    console.log('Submitting product with category ID:', newProduct.category_id);
    console.log('Serial entries:', serialEntries);
    
    createProduct.mutate(newProduct, {
      onSuccess: (data) => {
        toast.success(`Product added successfully with ${serialEntries.length} serial entries`);
        setCreatedProduct({ ...newProduct, id: data?.id, serialEntries });
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
          productName={`${createdProduct.brand} ${createdProduct.model}`}
          barcode={createdProduct.barcode}
          price={createdProduct.price}
          serialEntries={createdProduct.serialEntries}
          trigger={
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-background p-6 rounded-lg shadow-lg border max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Product Created Successfully!</h3>
                <div className="text-center mb-4">
                  <BarcodeGenerator value={createdProduct.barcode} />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Would you like to print barcode labels for this product? ({createdProduct.serialEntries?.length || 1} labels)
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
          <Smartphone className="h-5 w-5" />
          Add Product with Serial Numbers
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <ProductFormFields
            brand={brand}
            setBrand={setBrand}
            model={model}
            setModel={setModel}
            year={year}
            setYear={setYear}
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
            batteryLevel={batteryLevel}
            setBatteryLevel={setBatteryLevel}
            requiresSerial={requiresSerial}
          />
          
          <SerialNumbersInput
            serialNumbers={serialNumbers}
            setSerialNumbers={setSerialNumbers}
            setStock={setStock}
          />
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