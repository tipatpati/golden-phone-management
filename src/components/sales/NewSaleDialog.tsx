
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Scan } from "lucide-react";
import { BarcodeScannerTrigger } from "@/components/ui/barcode-scanner";
import { supabaseProductApi } from "@/services/supabaseProducts";
import { useCreateSale } from "@/services";
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

  

  const addProduct = (product: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
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
      console.log('About to create sale with data:', {
        client_id: selectedClient?.id,
        salesperson_id: user.id,
        payment_method: paymentMethod,
        notes,
        sale_items: saleItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          serial_number: item.serial_number
        }))
      });
      
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
      
      console.log('Sale creation completed:', createdSaleData);
      
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
    
    try {
      const scannedProducts = await supabaseProductApi.getProducts(barcode);
      
      if (scannedProducts && scannedProducts.length === 1) {
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
        <Button className="w-full lg:w-auto bg-green-600 hover:bg-green-700 text-white min-h-[48px] text-base font-medium">
          <Plus className="mr-2 h-4 w-4" />
          Nuova Vendita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-[95vw] sm:w-[90vw] md:w-[85vw] max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader>
          <DialogTitle>Crea Nuova Vendita</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Quick Barcode Scanner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-blue-50 rounded-lg border">
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 text-base sm:text-lg">Scansione Rapida</h3>
              <p className="text-sm sm:text-base text-blue-700 mt-1">Scansiona i codici a barre dei prodotti per aggiungerli istantaneamente</p>
            </div>
            <BarcodeScannerTrigger
              onScan={handleDirectBarcodeScanned}
              variant="default"
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px] px-4 sm:px-6 text-sm sm:text-base font-medium shrink-0 w-full sm:w-auto"
            >
              <Scan className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Scansiona Codice
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
            <div className="space-y-3">
              <Label className="text-base font-medium">Metodo di Pagamento *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Seleziona metodo di pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash" className="h-12 text-base">Contanti</SelectItem>
                  <SelectItem value="card" className="h-12 text-base">Carta</SelectItem>
                  <SelectItem value="bank_transfer" className="h-12 text-base">Bonifico Bancario</SelectItem>
                  <SelectItem value="other" className="h-12 text-base">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Note</Label>
              <Textarea
                placeholder="Note aggiuntive..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[48px] text-base resize-none"
                rows={3}
              />
            </div>
          </div>

          <SaleTotals saleItems={saleItems} />

          <div className="flex flex-col gap-3 sm:gap-4 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={!isFormValid || createSale.isPending}
              className="w-full min-h-[48px] text-base font-semibold bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {createSale.isPending ? "Creazione..." : "Crea Vendita"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="w-full min-h-[44px] text-base"
              size="lg"
            >
              Annulla
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
