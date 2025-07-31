import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProduct, useCategories, useProducts } from "@/services/products/ProductReactQueryService";
import { Product } from "@/services/products/types";
import { toast } from "@/components/ui/sonner";
import { generateSKUBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery } from "@/utils/serialNumberUtils";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { SerialNumbersInput } from "./SerialNumbersInput";
import { RefreshCw } from "lucide-react";
import { log } from "@/utils/logger";
import { BaseDialog } from "@/components/common/BaseDialog";
import { FormField } from "@/components/common/FormField";
import { CATEGORY_OPTIONS } from "@/components/inventory/ProductFormFields";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";

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
  const [description, setDescription] = useState(product.description || "");
  const [supplier, setSupplier] = useState(product.supplier || "");
  const [barcode, setBarcode] = useState(product.barcode || "");
  const [hasSerial, setHasSerial] = useState(product.has_serial || false);
  const [serialNumbers, setSerialNumbers] = useState<string>(
    product.serial_numbers ? product.serial_numbers.join('\n') : ""
  );
  // Track initial serial count to calculate new additions
  const [initialSerialCount] = useState(product.serial_numbers?.length || 0);
  

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

  // Generate individual barcodes for each serial number
  const generateUnitBarcodes = React.useMemo(() => {
    if (!hasSerial || !serialNumbers.trim()) return [];
    
    const lines = serialNumbers.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
      const parsed = parseSerialWithBattery(line);
      const barcode = generateSKUBasedBarcode(parsed.serial, product.id, parsed.batteryLevel);
      return {
        serial: line.trim(),
        barcode: barcode,
        index: index
      };
    });
  }, [serialNumbers, product.id, hasSerial]);

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
      const allSerialArray = serialNumbers.split('\n').map(s => s.trim()).filter(s => s !== "");
      
      for (const serial of allSerialArray) {
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
      // Parse all serial numbers from the unified input
      const allSerialArray = hasSerial && serialNumbers.trim() 
        ? serialNumbers.split('\n').map(s => s.trim()).filter(s => s !== "") 
        : [];
      
      // Calculate new stock: use serial count if has_serial, otherwise keep manual stock
      const newStock = hasSerial ? allSerialArray.length : parseInt(stock);
      
      // Calculate how many new units were added
      const addedUnits = hasSerial ? Math.max(0, allSerialArray.length - initialSerialCount) : 0;
        
      const updatedProduct = {
        brand,
        model,
        year: year ? parseInt(year) : undefined,
        category_id: parseInt(categoryId),
        price: parseFloat(price),
        min_price: parseFloat(minPrice),
        max_price: parseFloat(maxPrice),
        stock: newStock,
        threshold: parseInt(threshold),
        description: description || undefined,
        supplier: supplier || undefined,
        barcode: barcode || undefined,
        has_serial: hasSerial,
        serial_numbers: hasSerial ? allSerialArray : undefined,
      };

      await updateProduct.mutateAsync({ 
        id: product.id, 
        data: updatedProduct 
      });
      
      if (addedUnits > 0) {
        toast.success(`Product updated successfully! Added ${addedUnits} new units. Total stock: ${newStock}`);
      } else {
        toast.success("Product updated successfully!");
      }
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

        <FormField
          label="Description"
          type="textarea"
          value={description}
          onChange={(value) => setDescription(value)}
          placeholder="Product description..."
          className="md:col-span-2"
          rows={2}
        />

        <FormField
          label="Supplier"
          type="input"
          value={supplier}
          onChange={(value) => setSupplier(value)}
          placeholder="Supplier name"
          className="md:col-span-2"
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
            <div>
              <SerialNumbersInput
                serialNumbers={serialNumbers}
                setSerialNumbers={setSerialNumbers}
                setStock={(value) => setStock(value)} // Auto-update stock based on serial count
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use "Add New Unit" button above to add new serial numbers to this product. Stock will update automatically.
              </p>
            </div>
          )}
        </div>

        {/* Unit Barcodes Section */}
        {hasSerial && generateUnitBarcodes.length > 0 && (
          <div className="md:col-span-2">
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium">Unit Barcodes</h4>
              <div className="flex flex-col gap-4">
                {generateUnitBarcodes.map((unit) => (
                  <div key={unit.index} className="p-3 bg-background rounded border">
                    <div className="text-sm font-medium mb-2">
                      Serial: {unit.serial}
                    </div>
                    <div className="flex justify-center mb-2">
                      <BarcodeGenerator value={unit.barcode} />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {unit.barcode}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseDialog>
  );
}