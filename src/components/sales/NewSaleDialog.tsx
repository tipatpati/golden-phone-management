
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useCreateSale } from "@/services/useSales";
import { useAuth } from "@/contexts/AuthContext";
import { ClientSelector } from "./ClientSelector";
import { ProductSelector } from "./ProductSelector";
import { SaleItemsList } from "./SaleItemsList";
import { SaleTotals } from "./SaleTotals";

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
          product_name: product.name,
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
      await createSale.mutateAsync({
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
      
      // Reset form
      setSelectedClient(null);
      setSaleItems([]);
      setPaymentMethod("");
      setNotes("");
      setOpen(false);
    } catch (error) {
      console.error('Error creating sale:', error);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sale</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <ClientSelector
            selectedClient={selectedClient}
            onClientSelect={setSelectedClient}
            onClientClear={() => setSelectedClient(null)}
          />

          <ProductSelector onProductAdd={addProduct} />

          <SaleItemsList
            saleItems={saleItems}
            onQuantityUpdate={updateQuantity}
            onPriceUpdate={updatePrice}
            onSerialNumberUpdate={updateSerialNumber}
            onRemoveItem={removeProduct}
          />

          {/* Payment Method */}
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

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <SaleTotals saleItems={saleItems} />

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || createSale.isPending}
            >
              {createSale.isPending ? "Creating..." : "Create Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
