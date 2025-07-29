
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Scan } from "lucide-react";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { supabaseProductApi } from "@/services/supabaseProducts";
import { useCreateSale } from "@/services/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { ClientSelector } from "./ClientSelector";
import { ProductSelector } from "./ProductSelector";
import { ProductRecommendations } from "./ProductRecommendations";
import { SaleItemsList } from "./SaleItemsList";
import { SaleTotals } from "./SaleTotals";
import { SaleReceiptDialog } from "./SaleReceiptDialog";
import { toast } from "@/components/ui/sonner";

type SaleItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  min_price?: number;
  max_price?: number;
  serial_number?: string;
};

export function NewSaleDialog() {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [createdSale, setCreatedSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const createSale = useCreateSale();
  const { user } = useAuth();

  console.log('NewSaleDialog - Current user:', user?.id);

  const addProduct = (product: any) => {
    console.log('Adding product:', product);
    const existingItem = saleItems.find(item => item.product_id === product.id);
    if (existingItem) {
      setSaleItems(items => 
        items.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSaleItems(items => [
        ...items,
        {
          product_id: product.id,
          product_name: `${product.brand} ${product.model}`,
          quantity: 1,
          unit_price: product.price,
          min_price: product.min_price,
          max_price: product.max_price,
        }
      ]);
    }
  };

  const removeProduct = (productId: string) => {
    setSaleItems(items => items.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
      return;
    }
    setSaleItems(items => 
      items.map(item => 
        item.product_id === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const updatePrice = (productId: string, price: number) => {
    setSaleItems(items => 
      items.map(item => 
        item.product_id === productId 
          ? { ...item, unit_price: price }
          : item
      )
    );
  };

  const updateSerialNumber = (productId: string, serialNumber: string) => {
    setSaleItems(items => 
      items.map(item => 
        item.product_id === productId 
          ? { ...item, serial_number: serialNumber }
          : item
      )
    );
  };

  // Check if form is valid
  const isFormValid = saleItems.length > 0 && paymentMethod && user?.id;

  console.log('Form validation:', {
    hasItems: saleItems.length > 0,
    hasPaymentMethod: !!paymentMethod,
    hasUserId: !!user?.id,
    isValid: isFormValid
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      console.log('Form validation failed');
      return;
    }

    // Validate that all prices are within allowed range
    const invalidPriceItems = saleItems.filter(item => 
      item.min_price && item.max_price && 
      (item.unit_price < item.min_price || item.unit_price > item.max_price)
    );
    
    if (invalidPriceItems.length > 0) {
      const invalidNames = invalidPriceItems.map(item => item.product_name).join(', ');
      alert(`The following items have prices outside the allowed range: ${invalidNames}`);
      return;
    }

    try {
      console.log('Submitting sale with user ID:', user.id);
      const createdSaleData = await createSale.mutateAsync({
        client_id: selectedClient?.id,
        salesperson_id: user.id,
        payment_method: paymentMethod as any,
        notes,
        sale_items: saleItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          serial_number: item.serial_number
        }))
      });
      
      // Store the created sale and show receipt
      setCreatedSale(createdSaleData);
      setShowReceipt(true);
      
      // Reset form
      setSelectedClient(null);
      setSaleItems([]);
      setPaymentMethod("");
      setNotes("");
      setOpen(false);
      
      toast.success("Sale created successfully! Receipt is ready to print.");
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error("Failed to create sale. Please try again.");
    }
  };

  // Handle direct barcode scanning for quick product addition
  const handleDirectBarcodeScanned = async (barcode: string) => {
    console.log('Direct barcode scanned:', barcode);
    
    try {
      const scannedProducts = await supabaseProductApi.getProducts(barcode);
      
      if (scannedProducts && scannedProducts.length === 1) {
        console.log('Auto-adding scanned product:', scannedProducts[0]);
        addProduct(scannedProducts[0]);
        toast.success(`Added ${scannedProducts[0].brand} ${scannedProducts[0].model} to sale`);
      } else if (scannedProducts && scannedProducts.length > 1) {
        toast.error(`Multiple products found for barcode ${barcode}. Please use the product search to select the correct one.`);
      } else {
        toast.error(`No product found for barcode ${barcode}`);
      }
    } catch (error) {
      console.error('Error searching for scanned product:', error);
      toast.error('Error scanning barcode. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Create New Sale</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Quick Barcode Scanner */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
            <div>
              <h3 className="font-medium text-blue-900">Quick Scan</h3>
              <p className="text-sm text-blue-700">Scan product barcodes to add them instantly</p>
            </div>
            <BarcodeScannerTrigger
              onScan={handleDirectBarcodeScanned}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Scan className="h-4 w-4 mr-2" />
              Scan Barcode
            </BarcodeScannerTrigger>
          </div>

          {/* Client and Product Selection - Side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ClientSelector
              selectedClient={selectedClient}
              onClientSelect={setSelectedClient}
              onClientClear={() => setSelectedClient(null)}
            />

            <ProductSelector onProductAdd={addProduct} />
          </div>

          {saleItems.length > 0 && (
            <ProductRecommendations 
              productId={saleItems[saleItems.length - 1].product_id}
              onProductAdd={addProduct}
              addedProductIds={saleItems.map(item => item.product_id)}
            />
          )}

          <SaleItemsList
            saleItems={saleItems}
            onQuantityUpdate={updateQuantity}
            onPriceUpdate={updatePrice}
            onSerialNumberUpdate={updateSerialNumber}
            onRemoveItem={removeProduct}
          />

          {/* Payment Method and Notes - Side by side on larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[2.5rem]"
              />
            </div>
          </div>

          <SaleTotals saleItems={saleItems} />

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || createSale.isPending}
              className="w-full sm:w-auto sm:flex-1"
            >
              {createSale.isPending ? "Creating..." : "Create Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Auto-show receipt dialog after sale creation */}
      {createdSale && showReceipt && (
        <SaleReceiptDialog 
          sale={createdSale}
          open={showReceipt}
          onOpenChange={setShowReceipt}
        />
      )}
    </Dialog>
  );
}
