import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProduct, useCategories } from "@/services/useProducts";
import { Product } from "@/services/supabaseProducts";
import { toast } from "@/components/ui/sonner";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { RefreshCw } from "lucide-react";
import { log } from "@/utils/logger";
import { BaseDialog } from "@/components/common/BaseDialog";
import { FormField } from "@/components/common/FormField";
import { CATEGORY_OPTIONS } from "@/components/inventory/ProductFormFields";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { useProducts } from "@/services/products/ProductReactQueryService";

interface EditProductFormProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductForm({ product, open, onClose, onSuccess }: EditProductFormProps) {
  log.debug('EditProductForm rendering', { productId: product.id }, 'EditProductForm');
  
  const [brand, setBrand] = useState(product.brand || "");
  const [model, setModel] = useState(product.model || "");
  const [year, setYear] = useState(product.year?.toString() || "");
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
  

  const updateProduct = useUpdateProduct();
  const { data: categories } = useCategories();
  const { data: products } = useProducts();

  // Get unique brands and models for autocomplete
  const uniqueBrands = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const brands = new Set(products.map(p => p.brand).filter(Boolean));
    return Array.from(brands) as string[];
  }, [products]);

  const uniqueModels = React.useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    const models = new Set(products.map(p => p.model).filter(Boolean));
    return Array.from(models) as string[];
  }, [products]);

  // Auto-generate barcode when serial numbers change
  useEffect(() => {
    if (serialNumbers.trim()) {
      const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
      if (lines.length > 0) {
        const parsed = parseSerialWithBattery(lines[0]);
        const generatedBarcode = generateSKUBasedBarcode(parsed.serial, product.id, parsed.batteryLevel);
        setBarcode(generatedBarcode);
      }
    }
  }, [serialNumbers, product.id]);

  const generateNewBarcode = () => {
    if (!serialNumbers.trim()) {
      toast.error("Please enter serial numbers first");
      return;
    }

    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      toast.error("Please enter at least one serial number");
      return;
    }

    const parsed = parseSerialWithBattery(lines[0]);
    const newBarcode = generateSKUBasedBarcode(parsed.serial, product.id, parsed.batteryLevel);
    setBarcode(newBarcode);
    toast.success("New barcode generated");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    log.debug('Submitting product update', { brand, model, year, categoryId, price, stock, threshold }, 'EditProductForm');
    
    // Mandatory brand and model validation
    if (!brand.trim() || !model.trim()) {
      toast.error("Brand and model are required");
      return;
    }


    // Validate that a barcode exists
    if (!barcode) {
      toast.error("Barcode is required and must be generated from brand and model");
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
        brand,
        model,
        year: year ? parseInt(year) : undefined,
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
      
      toast.success("Product updated successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      log.error('Product update failed', error, 'EditProductForm');
    }
  };

  log.debug('Rendering form', { brand, model, year }, 'EditProductForm');

  return (
    <BaseDialog
      title={`Edit Product: ${product.brand} ${product.model}`}
      open={open}
      onClose={onClose}
      onSubmit={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
      isLoading={updateProduct.isPending}
      submitText="Update Product"
      maxWidth="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-on-surface">
              Brand <span className="text-destructive ml-1">*</span>
            </Label>
            <AutocompleteInput
              value={brand}
              onChange={setBrand}
              suggestions={uniqueBrands}
              placeholder="Enter product brand"
            />
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-on-surface">
              Model <span className="text-destructive ml-1">*</span>
            </Label>
            <AutocompleteInput
              value={model}
              onChange={setModel}
              suggestions={uniqueModels}
              placeholder="Enter product model"
            />
          </div>
        </div>

        <FormField
          label="Year"
          type="input"
          inputType="number"
          value={year}
          onChange={(value) => setYear(value)}
          placeholder="2023"
          className="md:col-span-1"
        />

        <FormField
          label="Category"
          type="select"
          value={categoryId}
          onChange={(value) => setCategoryId(value)}
          options={CATEGORY_OPTIONS.map(cat => ({ value: cat.id.toString(), label: cat.name }))}
          required
          className="md:col-span-1"
        />

        <FormField
          label="Price (€)"
          type="input"
          inputType="number"
          value={price}
          onChange={(value) => setPrice(value)}
          placeholder="0.00"
          required
          className="md:col-span-1"
        />

        <FormField
          label="Min Price (€)"
          type="input"
          inputType="number"
          value={minPrice}
          onChange={(value) => setMinPrice(value)}
          placeholder="0.00"
          required
          className="md:col-span-1"
        />

        <FormField
          label="Max Price (€)"
          type="input"
          inputType="number"
          value={maxPrice}
          onChange={(value) => setMaxPrice(value)}
          placeholder="0.00"
          required
          className="md:col-span-1"
        />

        <FormField
          label="Stock"
          type="input"
          inputType="number"
          value={stock}
          onChange={(value) => setStock(value)}
          placeholder="0"
          required
          className="md:col-span-1"
        />

        <FormField
          label="Low Stock Threshold"
          type="input"
          inputType="number"
          value={threshold}
          onChange={(value) => setThreshold(value)}
          placeholder="5"
          required
          className="md:col-span-1"
        />


        <div className="md:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="has-serial"
              checked={hasSerial}
              onChange={(e) => setHasSerial(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="has-serial" className="text-sm font-medium">
              This product has serial numbers
            </label>
          </div>

          {hasSerial && (
            <FormField
              label="IMEI/Serial Numbers with Battery Level (One per line)"
              type="textarea"
              value={serialNumbers}
              onChange={(value) => setSerialNumbers(value)}
              placeholder="352908764123456 85&#10;352908764123457 92&#10;352908764123458 78"
              description='Format: IMEI/Serial followed by battery level (e.g., "352908764123456 85")'
              rows={5}
            />
          )}
        </div>

        {/* Barcode Section */}
        <div className="md:col-span-2">
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
        </div>
      </div>
    </BaseDialog>
  );
}