import React, { useState, useRef } from "react";
import { Plus, Scan, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BaseDialog } from "@/components/common/BaseDialog";
import { ProductForm } from "./forms/ProductForm";
import { ProductFormData } from "./forms/types";
import { useCreateProduct } from "@/services/useProducts";
import { ProductUnitsService } from "@/services/products/productUnitsService";
import { generateSerialBasedBarcode } from "@/utils/barcodeGenerator";
import { parseSerialWithBattery, formatSerialWithBattery } from "@/utils/serialNumberUtils";
import { ThermalLabelGenerator, useThermalLabels } from "./labels";
import { BarcodeGenerator } from "./BarcodeGenerator";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { useProducts } from "@/services/products/ProductReactQueryService";
import { toast } from "@/components/ui/sonner";
import { logger } from "@/utils/logger";

interface AddProductDialogProps {
  open?: boolean;
  onClose?: () => void;
}

export function AddProductDialog({ open: externalOpen, onClose: externalOnClose }: AddProductDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnClose ? externalOnClose : setInternalOpen;
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const formSubmitRef = useRef<(() => Promise<void>) | null>(null);
  
  const createProduct = useCreateProduct();
  const { data: products } = useProducts();

  const handleBarcodeScanned = (scannedBarcode: string) => {
    const existingProduct = Array.isArray(products) 
      ? products.find(p => p.barcode === scannedBarcode) 
      : undefined;
    
    if (existingProduct) {
      toast.success(`Product information loaded from barcode: ${existingProduct.brand} ${existingProduct.model}`);
    } else {
      toast.info(`Barcode scanned: ${scannedBarcode}. No existing product found - you can add this as a new product.`);
    }
  };

  const handleSubmit = async (data: ProductFormData) => {
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
        onSuccess: async (responseData) => {
          try {
            // Create individual units with IMEI barcodes if product has serials
            if (data.has_serial && data.serial_numbers && data.serial_numbers.length > 0) {
              const units = await ProductUnitsService.createUnitsForProduct(
                responseData?.id,
                data.serial_numbers
              );
              console.log(`✅ Created ${units.length} product units with IMEI barcodes`);
            }
            
            handleProductCreated({ 
              ...newProduct, 
              id: responseData?.id, 
              serialEntries 
            });
            setOpen(false);
            resolve();
          } catch (error) {
            console.error('Error creating product units:', error);
            toast.error('Product created but failed to generate unit barcodes');
            reject(error);
          }
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
    setShowConfirmDialog(true);
  };

  const handlePrintDialogClose = () => {
    setShowPrintDialog(false);
    setShowConfirmDialog(false);
    setCreatedProduct(null);
  };

  const handleShowPrintLabels = () => {
    setShowConfirmDialog(false);
    setShowPrintDialog(true);
  };

  return (
    <>
      {/* Only show button if not controlled externally */}
      {externalOpen === undefined && (
        <Button 
          onClick={() => {
            console.log('🔵 Aggiungi Prodotto button clicked');
            setInternalOpen(true);
          }} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Aggiungi Prodotto
        </Button>
      )}

      {showConfirmDialog && createdProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg border max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Product Created Successfully!</h3>
            <div className="text-center mb-4">
              <BarcodeGenerator value={createdProduct.barcode} />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Would you like to print thermal labels for this product? ({createdProduct.serialEntries?.length || 1} labels)
            </p>
            <div className="flex gap-2">
              <Button onClick={handlePrintDialogClose} variant="outline" className="flex-1">
                Skip
              </Button>
              <Button onClick={handleShowPrintLabels} className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Labels
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {createdProduct && (
        <ThermalLabelGenerator
          open={showPrintDialog}
          onOpenChange={(open) => {
            setShowPrintDialog(open);
            if (!open) handlePrintDialogClose();
          }}
          labels={useThermalLabels([{
            id: createdProduct.id,
            brand: createdProduct.brand,
            model: createdProduct.model,
            price: createdProduct.price,
            serial_numbers: createdProduct.serialEntries?.map((e: any) => e.serial),
            category: createdProduct.category
          }])}
          companyName="GOLDEN PHONE SRL"
        />
      )}

      <BaseDialog
        title="Aggiungi Prodotto con Numeri Seriali"
        open={open}
        onClose={() => {
          if (externalOnClose) {
            externalOnClose();
          } else {
            setInternalOpen(false);
          }
        }}
        maxWidth="2xl"
        showActions={false}
      >
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
          key={open ? 'open' : 'closed'} // Force remount when dialog opens to reset state
          onSubmit={handleSubmit}
          isLoading={createProduct.isPending}
          submitText={createProduct.isPending ? "Aggiungendo..." : "Aggiungi Prodotto"}
          onRegisterSubmit={(submitFn) => {
            formSubmitRef.current = submitFn;
          }}
        />
        
        {/* Custom submit button */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t bg-muted/30 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (externalOnClose) {
                externalOnClose();
              } else {
                setInternalOpen(false);
              }
            }}
            disabled={createProduct.isPending}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Annulla
          </Button>
          <Button
            onClick={async () => {
              console.log('🔄 Manual submit button clicked');
              if (formSubmitRef.current) {
                await formSubmitRef.current();
              } else {
                console.error('❌ Form submit function not available');
              }
            }}
            disabled={createProduct.isPending}
            className="w-full sm:w-auto min-w-[120px] order-1 sm:order-2"
          >
            {createProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {createProduct.isPending ? "Aggiungendo..." : "Aggiungi Prodotto"}
          </Button>
        </div>
      </BaseDialog>
    </>
  );
}