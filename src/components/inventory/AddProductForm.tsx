import React, { useState } from "react";
import { Plus, Smartphone, Printer } from "lucide-react";
import { BaseDialog, FormField } from "@/components/common";
import { useForm } from "@/hooks/useForm";
import { CreateProductSchema } from "@/schemas/validation";
import { useCreateProduct } from "@/services/useProducts";
import { SerialNumbersInput } from "./SerialNumbersInput";
import { generateSerialBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery, validateSerialWithBattery } from "@/utils/serialNumberUtils";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { BarcodePrintDialog } from "./BarcodePrintDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { useSearchBrands, useModelsByBrand } from "@/services/brands/BrandsReactQueryService";
import { logger } from "@/utils/logger";

// Category mapping
const CATEGORY_OPTIONS = [
  { id: 1, name: "Phones" },
  { id: 2, name: "Accessories" },
  { id: 3, name: "Spare Parts" },
  { id: 4, name: "Protection" },
];

interface ProductFormData {
  brand: string;
  model: string;
  year?: number;
  category_id: number;
  price: number;
  min_price: number;
  max_price: number;
  stock: number;
  threshold: number;
  battery_level?: number;
  has_serial: boolean;
  serial_numbers?: string[];
  barcode?: string;
}

export function AddProductForm() {
  const [open, setOpen] = useState(false);
  const [serialNumbers, setSerialNumbers] = useState("");
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  const createProduct = useCreateProduct();
  
  // Form with validation - using individual state since we have complex custom validation
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    category_id: '',
    price: '',
    min_price: '',
    max_price: '',
    stock: 0,
    threshold: '5',
    battery_level: '85',
    has_serial: true,
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get brands and models from dedicated database
  const { data: searchedBrands = [] } = useSearchBrands(formData.brand || '');
  const { data: modelsByBrand = [] } = useModelsByBrand(formData.brand);
  
  // Convert to suggestion arrays
  const brandSuggestions = searchedBrands.map(b => b.name);
  const modelSuggestions = modelsByBrand.map(m => m.name);

  // Check if category requires serial numbers (accessories are optional)
  const requiresSerial = formData.category_id !== "2";

  const handleSubmit = async () => {
    // Validation
    if (!formData.brand || !formData.model || !formData.category_id || !formData.price || !formData.min_price || !formData.max_price || !formData.threshold) {
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
    const priceNum = parseFloat(formData.price);
    const minPriceNum = parseFloat(formData.min_price);
    const maxPriceNum = parseFloat(formData.max_price);
    
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
    const enhancedBrand = colors.length > 0 ? `${formData.brand} (${colors.join(', ')})` : formData.brand;
    
    // Set stock to match number of serial entries (each serial = 1 unit of stock)
    const actualStock = serialEntries.length > 0 ? serialEntries.length : formData.stock;
    
    const newProduct = {
      brand: enhancedBrand,
      model: formData.model,
      year: formData.year ? parseInt(formData.year) : undefined,
      category_id: parseInt(formData.category_id),
      price: priceNum,
      min_price: minPriceNum,
      max_price: maxPriceNum,
      stock: actualStock,
      threshold: parseInt(formData.threshold),
      has_serial: serialEntries.length > 0,
      serial_numbers: serialEntries.map(entry => 
        `${entry.serial}${entry.batteryLevel ? ` ${entry.batteryLevel}` : ''}${entry.color ? ` ${entry.color}` : ''}`
      ),
      barcode: serialEntries.length > 0 ? serialEntries[0].barcode : generateSerialBasedBarcode(`${formData.brand} ${formData.model}`, undefined, 0)
    };
    
    logger.debug('Submitting product', { 
      categoryId: newProduct.category_id,
      serialEntriesCount: serialEntries.length 
    }, 'AddProductForm');
    
    return new Promise((resolve, reject) => {
      createProduct.mutate(newProduct, {
        onSuccess: (data) => {
          // Handle the created product
          handleProductCreated({ ...newProduct, id: data?.id, serialEntries });
          setOpen(false);
          // Reset form
          setFormData({
            brand: '',
            model: '',
            year: '',
            category_id: '',
            price: '',
            min_price: '',
            max_price: '',
            stock: 0,
            threshold: '5',
            battery_level: '85',
            has_serial: true,
          });
          setSerialNumbers("");
          resolve(data);
        },
        onError: (error) => {
          logger.error('Product creation failed', error, 'AddProductForm');
          reject(error);
        }
      });
    });
  };

  const handleProductCreated = (data: any) => {
    toast.success(`Product added successfully with ${data.serialEntries?.length || 1} serial entries`);
    setCreatedProduct({ ...data, serialEntries: data.serialEntries || [] });
    setShowPrintDialog(true);
  };

  const handlePrintDialogClose = () => {
    setShowPrintDialog(false);
    setCreatedProduct(null);
  };

  return (
    <>
      {/* Trigger Button */}
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Add Product
      </Button>

      {/* Print Dialog */}
      {showPrintDialog && createdProduct && (
        <BarcodePrintDialog
          productName={`${createdProduct.brand} ${createdProduct.model}`}
          barcode={createdProduct.barcode}
          price={createdProduct.price}
          serialEntries={createdProduct.serialEntries}
          onBarcodeGenerated={() => {}}
          trigger={
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg border max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Product Created Successfully!</h3>
                <div className="text-center mb-4">
                  <BarcodeGenerator value={createdProduct.barcode} />
                </div>
                <p className="text-sm text-gray-600 mb-4">
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

      <BaseDialog
        title="Add Product with Serial Numbers"
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        isLoading={createProduct.isPending}
        submitText={createProduct.isPending ? "Adding..." : "Add Product"}
        maxWidth="2xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Brand *</label>
            <AutocompleteInput
              value={formData.brand}
              onChange={(value) => updateField('brand', value)}
              suggestions={brandSuggestions}
              placeholder="Apple, Samsung, Google..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Model *</label>
            <AutocompleteInput
              value={formData.model}
              onChange={(value) => updateField('model', value)}
              suggestions={modelSuggestions}
              placeholder="iPhone 13 Pro Max, Galaxy S23..."
            />
          </div>

          <FormField
            label="Year (optional)"
            value={formData.year}
            onChange={(value) => updateField('year', value)}
            inputType="number"
            placeholder="2024"
          />

          <FormField
            type="select"
            label="Category"
            required
            value={formData.category_id}
            onChange={(value) => updateField('category_id', value)}
            options={CATEGORY_OPTIONS.map(cat => ({
              value: cat.id.toString(),
              label: `${cat.name} ${cat.id === 2 ? "(Serial optional)" : "(Serial required)"}`
            }))}
            placeholder="Select a category"
          />

          <FormField
            label="Base Price (€)"
            required
            value={formData.price}
            onChange={(value) => updateField('price', value)}
            inputType="number"
            placeholder="899.99"
          />

          <FormField
            label="Minimum Selling Price (€)"
            required
            value={formData.min_price}
            onChange={(value) => updateField('min_price', value)}
            inputType="number"
            placeholder="799.99"
          />

          <FormField
            label="Maximum Selling Price (€)"
            required
            value={formData.max_price}
            onChange={(value) => updateField('max_price', value)}
            inputType="number"
            placeholder="999.99"
          />

          <FormField
            label="Low Stock Threshold"
            required
            value={formData.threshold}
            onChange={(value) => updateField('threshold', value)}
            inputType="number"
          />

          <FormField
            label="Battery Level (%)"
            required
            value={formData.battery_level}
            onChange={(value) => updateField('battery_level', value)}
            inputType="number"
            placeholder="85"
            description="Enter the current battery level (0-100%)"
          />
        </div>

        {!requiresSerial && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This category allows products without serial numbers. You can leave the serial numbers field empty if needed.
            </p>
          </div>
        )}

        <SerialNumbersInput
          serialNumbers={serialNumbers}
          setSerialNumbers={setSerialNumbers}
          setStock={(stock) => updateField('stock', parseInt(stock))}
        />
      </BaseDialog>
    </>
  );
}