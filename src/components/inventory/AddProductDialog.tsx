import React, { useState } from "react";
import { Plus, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/common/BaseDialog";
import { ProductForm } from "./forms/ProductForm";
import { ProductFormData } from "./forms/types";
import { useCreateProduct } from "@/services/useProducts";
import { generateSerialBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery, formatSerialWithBattery } from "@/utils/serialNumberUtils";
import { BarcodePrintDialog } from "./BarcodePrintDialog";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useProducts } from "@/services/products/ProductReactQueryService";
import { toast } from "@/components/ui/sonner";
import { logger } from "@/utils/logger";

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  
  const createProduct = useCreateProduct();
  const { data: products } = useProducts();

  // Handle barcode scan to auto-populate product info
  const handleBarcodeScanned = (scannedBarcode: string) => {
    // Look for existing product with this barcode
    const existingProduct = Array.isArray(products) 
      ? products.find(p => p.barcode === scannedBarcode) 
      : undefined;
    
    if (existingProduct) {
      // Auto-populate form with existing product data - this will be handled by ProductForm
      toast.success(`Product information loaded from barcode: ${existingProduct.brand} ${existingProduct.model}`);
      // TODO: Implement form pre-population in ProductForm
    } else {
      toast.info(`Barcode scanned: ${scannedBarcode}. No existing product found - you can add this as a new product.`);
    }
  };

  const handleSubmit = async (data: ProductFormData) => {
    // Parse serial entries and generate individual barcodes
    const serialEntries = data.serial_numbers?.map(line => {
      const parsed = parseSerialWithBattery(line);
      const barcode = generateSerialBasedBarcode(parsed.serial, undefined, parsed.batteryLevel);
      return {
        serial: parsed.serial,
        color: parsed.color,
        batteryLevel: parsed.batteryLevel,
        barcode: barcode
      };
    }) || [];

    // Collect colors for product name enhancement
    const colors = [...new Set(serialEntries.map(entry => entry.color).filter(Boolean))];
    const enhancedBrand = colors.length > 0 ? `${data.brand} (${colors.join(', ')})` : data.brand;
    
    const newProduct = {
      brand: enhancedBrand,
      model: data.model,
      year: data.year,
      category_id: data.category_id,
      price: data.price,
      min_price: data.min_price,
      max_price: data.max_price,
      stock: data.stock,
      threshold: data.threshold,
      has_serial: data.has_serial,
      serial_numbers: serialEntries.map(entry => 
        formatSerialWithBattery(entry.serial, entry.batteryLevel, entry.color)
      ),
      barcode: serialEntries.length > 0 
        ? serialEntries[0].barcode 
        : generateSerialBasedBarcode(`${data.brand} ${data.model}`, undefined, 0),
      description: data.description,
      supplier: data.supplier
    };
    
    logger.debug('Submitting product', { 
      categoryId: newProduct.category_id,
      serialEntriesCount: serialEntries.length 
    }, 'AddProductDialog');
    
    return new Promise<void>((resolve, reject) => {
      createProduct.mutate(newProduct, {
        onSuccess: (responseData) => {
          // Handle the created product
          handleProductCreated({ ...newProduct, id: responseData?.id, serialEntries });
          setOpen(false);
          resolve();
        },
        onError: (error) => {
          logger.error('Product creation failed', error, 'AddProductDialog');
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

  const handleDialogSubmit = async () => {
    if ((window as any).__currentProductFormSubmit) {
      await (window as any).__currentProductFormSubmit();
    }
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
                    Print Labels
                  </Button>
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* Main Dialog */}
      <BaseDialog
        title="Add Product with Serial Numbers"
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleDialogSubmit}
        isLoading={createProduct.isPending}
        submitText={createProduct.isPending ? "Adding..." : "Add Product"}
        maxWidth="2xl"
      >
        {/* Barcode Scanner Section */}
        <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-primary mb-1">Quick Fill from Barcode</h4>
              <p className="text-xs text-muted-foreground">
                Scan an existing product barcode to auto-populate form fields
              </p>
            </div>
            <BarcodeScannerTrigger
              onScan={handleBarcodeScanned}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Scan className="h-4 w-4" />
              Scan Barcode
            </BarcodeScannerTrigger>
          </div>
        </div>

        <ProductForm
          onSubmit={handleSubmit}
          isLoading={createProduct.isPending}
          submitText={createProduct.isPending ? "Adding..." : "Add Product"}
        />
      </BaseDialog>
    </>
  );
}