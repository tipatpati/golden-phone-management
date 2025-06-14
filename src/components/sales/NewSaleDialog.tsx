
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X } from "lucide-react";
import { useProducts } from "@/services/useProducts";
import { useClients } from "@/services/useClients";
import { useCreateSale } from "@/services/useSales";
import { useAuth } from "@/contexts/AuthContext";

type SaleItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  serial_number?: string;
};

export function NewSaleDialog() {
  const [open, setOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: products = [] } = useProducts(productSearch);
  const { data: clients = [] } = useClients(clientSearch);
  const createSale = useCreateSale();
  const { user } = useAuth();

  console.log('NewSaleDialog - Products available:', products.length);
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
        }
      ]);
    }
    setProductSearch("");
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

  const updateSerialNumber = (productId: string, serialNumber: string) => {
    setSaleItems(items => 
      items.map(item => 
        item.product_id === productId 
          ? { ...item, serial_number: serialNumber }
          : item
      )
    );
  };

  const subtotal = saleItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

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
      setClientSearch("");
      setProductSearch("");
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
          {/* Client Selection */}
          <div className="space-y-2">
            <Label>Client (Optional)</Label>
            {selectedClient ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {selectedClient.type === 'business' 
                    ? selectedClient.company_name 
                    : `${selectedClient.first_name} ${selectedClient.last_name}`
                  }
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedClient(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {clientSearch && clients.length > 0 && (
                  <div className="border rounded-md max-h-32 overflow-y-auto">
                    {clients.slice(0, 5).map((client) => (
                      <div
                        key={client.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedClient(client);
                          setClientSearch("");
                        }}
                      >
                        <div className="font-medium">
                          {client.type === 'business' 
                            ? client.company_name 
                            : `${client.first_name} ${client.last_name}`
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.email} • {client.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="space-y-2">
            <Label>Add Products</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products to add..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            {productSearch && products.length > 0 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                    onClick={() => addProduct(product)}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {product.sku} • Stock: {product.stock} • ${product.price}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {productSearch && products.length === 0 && (
              <div className="border rounded-md p-2 text-center text-muted-foreground">
                No products found matching "{productSearch}"
              </div>
            )}
          </div>

          {/* Sale Items */}
          {saleItems.length > 0 && (
            <div className="space-y-4">
              <Label>Sale Items</Label>
              <div className="space-y-2">
                {saleItems.map((item) => (
                  <div key={item.product_id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{item.product_name}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(item.product_id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || 0;
                            setSaleItems(items => 
                              items.map(i => 
                                i.product_id === item.product_id 
                                  ? { ...i, unit_price: price }
                                  : i
                              )
                            );
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Serial Number</Label>
                        <Input
                          placeholder="Optional"
                          value={item.serial_number || ""}
                          onChange={(e) => updateSerialNumber(item.product_id, e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="text-right mt-2 font-medium">
                      Total: ${(item.unit_price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Total */}
          {saleItems.length > 0 && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}

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
