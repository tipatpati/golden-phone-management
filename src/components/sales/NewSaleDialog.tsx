
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCreateSale } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/services/products/ProductReactQueryService";
import { SaleReceiptDialog } from "./SaleReceiptDialog";
import { DiscountManager } from "./DiscountManager";
import { HybridPaymentManager } from "./HybridPaymentManager";
import { SaleTotals } from "./SaleTotals";
import { StreamlinedSaleForm } from "./enhanced/StreamlinedSaleForm";
import { toast } from "@/components/ui/sonner";
import { SalesValidationService } from './SalesValidationService';
import { useSalesMonitoring } from './SalesMonitoringService';
import { SalesPermissionGuard } from './SalesPermissionGuard';

type SaleItem = {
  product_id: string;
  product_name: string;
  brand: string;
  model: string;
  year?: number;
  quantity: number;
  unit_price: number;
  min_price?: number;
  max_price?: number;
  serial_number?: string;
  stock?: number;
  product_unit_id?: string;
  barcode?: string;
  color?: string;
  storage?: number;
  ram?: number;
};

export function NewSaleDialog() {
  const [open, setOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [createdSale, setCreatedSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  
  // Discount state
  const [discountType, setDiscountType] = useState<'percentage' | 'amount' | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  
  // Hybrid payment state
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [bankTransferAmount, setBankTransferAmount] = useState(0);

  const createSale = useCreateSale();
  const { user } = useAuth();
  const { recordAudit, measureAsync, trackInteraction } = useSalesMonitoring();
  const { data: allProducts = [] } = useProducts();

  

  const addProduct = (saleItem: any) => {
    // Handle SaleItemWithUnit (from unit selector) or regular product
    if (saleItem.product_unit_id) {
      // This is a unit-level sale item
      setSaleItems(items => [
        ...items,
        {
          product_id: saleItem.product_id,
          product_name: `${saleItem.brand} ${saleItem.model}`,
          brand: saleItem.brand,
          model: saleItem.model,
          year: saleItem.year,
          quantity: saleItem.quantity,
          unit_price: saleItem.unit_price,
          serial_number: saleItem.serial_number,
          product_unit_id: saleItem.product_unit_id,
          barcode: saleItem.barcode,
          color: saleItem.color,
          storage: saleItem.storage,
          ram: saleItem.ram
        }
      ]);
    } else {
      // Regular product selection (fallback)
      const existingItem = saleItems.find(item => item.product_id === saleItem.product_id);
      if (existingItem) {
        setSaleItems(items => 
          items.map(item => 
            item.product_id === saleItem.product_id 
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setSaleItems(items => [
          ...items,
          {
            product_id: saleItem.product_id,
            product_name: `${saleItem.brand} ${saleItem.model}`,
            brand: saleItem.brand,
            model: saleItem.model,
            year: saleItem.year,
            quantity: saleItem.quantity || 1,
            unit_price: saleItem.unit_price || saleItem.price || saleItem.max_price || 0,
            min_price: saleItem.min_price,
            max_price: saleItem.max_price,
            stock: saleItem.stock,
          }
        ]);
      }
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

  // Calculate totals with discount - FIXED MATH
  const subtotal = Number(saleItems.reduce((sum, item) => sum + (Number(item.unit_price) * Number(item.quantity)), 0).toFixed(2));
  
  // Calculate discount amount with proper validation
  let discountAmount = 0;
  if (discountType === 'percentage' && discountValue > 0) {
    discountAmount = Number(((subtotal * Number(discountValue)) / 100).toFixed(2));
  } else if (discountType === 'amount' && discountValue > 0) {
    discountAmount = Math.min(Number(discountValue), subtotal); // Can't discount more than subtotal
  }
  
  const finalSubtotal = Number((subtotal - discountAmount).toFixed(2));
  const taxAmount = Number((finalSubtotal * 0.22).toFixed(2)); // 22% IVA
  const totalAmount = Number((finalSubtotal + taxAmount).toFixed(2));
  
  // Payment amount validation for hybrid payments - IMPROVED PRECISION
  const totalPaid = Number((Number(cashAmount) + Number(cardAmount) + Number(bankTransferAmount)).toFixed(2));
  const isHybridPayment = paymentMethod === 'hybrid';
  const isPaymentValid = isHybridPayment 
    ? Math.abs(totalPaid - totalAmount) < 0.005 // Improved tolerance for floating point precision
    : Boolean(paymentMethod);

  // Helper function to get product stock
  const getProductStock = (productId: string) => {
    const productsArray = Array.isArray(allProducts) ? allProducts : [];
    const product = productsArray.find(p => p.id === productId);
    return product?.stock || 0;
  };

  // Recent products for quick add (could be enhanced with actual recent data)
  const recentProducts = React.useMemo(() => {
    const productsArray = Array.isArray(allProducts) ? allProducts : [];
    return productsArray.slice(0, 4); // Simple implementation
  }, [allProducts]);

  // Check if form is valid
  const isFormValid = saleItems.length > 0 && isPaymentValid && user?.id;

  // Discount change handler
  const handleDiscountChange = (type: 'percentage' | 'amount' | null, value: number) => {
    setDiscountType(type);
    setDiscountValue(value);
  };

  // Hybrid payment change handler - IMPROVED VALIDATION
  const handlePaymentChange = (type: 'cash' | 'card' | 'bank_transfer', amount: number) => {
    // Ensure amount is not negative and doesn't exceed total
    const validAmount = Math.max(0, Math.min(Number(amount) || 0, totalAmount));
    
    switch (type) {
      case 'cash':
        setCashAmount(validAmount);
        break;
      case 'card':
        setCardAmount(validAmount);
        break;
      case 'bank_transfer':
        setBankTransferAmount(validAmount);
        break;
    }
  };

  // Reset hybrid payment amounts when switching from hybrid
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    if (method !== 'hybrid') {
      setCashAmount(0);
      setCardAmount(0);
      setBankTransferAmount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error("Per favore compila tutti i campi obbligatori");
      return;
    }

    // Enhanced validation with security checks
    const saleDataForValidation = {
      client_id: selectedClient?.id,
      payment_method: paymentMethod,
      payment_type: isHybridPayment ? 'hybrid' as const : 'single' as const,
      cash_amount: isHybridPayment ? cashAmount : (paymentMethod === 'cash' ? totalAmount : 0),
      card_amount: isHybridPayment ? cardAmount : (paymentMethod === 'card' ? totalAmount : 0),
      bank_transfer_amount: isHybridPayment ? bankTransferAmount : (paymentMethod === 'bank_transfer' ? totalAmount : 0),
      discount_amount: discountAmount,
      discount_percentage: discountType === 'percentage' ? discountValue : 0,
      notes,
      sale_items: saleItems
    };

    const validation = await SalesValidationService.validateSaleData(saleDataForValidation);
    if (!validation.isValid) {
      toast.error(`Errori di validazione: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      const saleData = {
        client_id: selectedClient?.id,
        salesperson_id: user.id,
        payment_method: paymentMethod as any,
        payment_type: isHybridPayment ? 'hybrid' as const : 'single' as const,
        cash_amount: isHybridPayment ? Number(cashAmount.toFixed(2)) : (paymentMethod === 'cash' ? Number(totalAmount.toFixed(2)) : 0),
        card_amount: isHybridPayment ? Number(cardAmount.toFixed(2)) : (paymentMethod === 'card' ? Number(totalAmount.toFixed(2)) : 0),
        bank_transfer_amount: isHybridPayment ? Number(bankTransferAmount.toFixed(2)) : (paymentMethod === 'bank_transfer' ? Number(totalAmount.toFixed(2)) : 0),
        discount_amount: Number(discountAmount.toFixed(2)),
        discount_percentage: discountType === 'percentage' ? Number(discountValue) : 0,
        notes,
        sale_items: saleItems.map(item => ({
          product_id: item.product_id,
          product_unit_id: item.product_unit_id,
          quantity: Number(item.quantity),
          unit_price: Number(Number(item.unit_price).toFixed(2)),
          serial_number: item.serial_number,
          barcode: item.barcode
        }))
      };
      
      console.log('Creating sale with validated data:', saleData);
      
      // Record audit log and measure performance
      const createdSaleData = await measureAsync(
        () => createSale.mutateAsync(saleData),
        'create',
        { itemCount: saleItems.length, totalAmount }
      );
      
      recordAudit('sale_created', {
        entityId: createdSaleData.id,
        newValues: { sale_number: createdSaleData.sale_number, total_amount: totalAmount }
      });
      
      console.log('Sale creation completed:', createdSaleData);
      
      // Store the created sale and show receipt
      setCreatedSale(createdSaleData);
      setShowReceipt(true);
      
      // Reset form with proper validation
      setSelectedClient(null);
      setSaleItems([]);
      setPaymentMethod("");
      setDiscountType(null);
      setDiscountValue(0);
      setCashAmount(0);
      setCardAmount(0);
      setBankTransferAmount(0);
      setNotes("");
      setOpen(false);
      
      toast.success("Garentille creata con successo! La ricevuta è pronta per la stampa.");
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error("Errore nella creazione della garentille. Verificare i dati e riprovare.");
    }
  };


  return (
    <SalesPermissionGuard requiredRole="create">
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full lg:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 text-lg font-bold py-6 px-8 min-h-[60px]">
          <Plus className="mr-3 h-7 w-7" />
          NUOVA GARENTILLE
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Crea Nuova Garentille</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <StreamlinedSaleForm
            saleItems={saleItems}
            selectedClient={selectedClient}
            paymentMethod={paymentMethod}
            notes={notes}
            onClientChange={setSelectedClient}
            onPaymentMethodChange={handlePaymentMethodChange}
            onNotesChange={setNotes}
            onAddProduct={addProduct}
            onUpdateQuantity={updateQuantity}
            onUpdatePrice={updatePrice}
            onSerialNumberUpdate={updateSerialNumber}
            onRemoveItem={removeProduct}
          />

          {/* Discount Manager */}
          {saleItems.length > 0 && (
            <DiscountManager
              subtotal={subtotal}
              discountType={discountType}
              discountValue={discountValue}
              onDiscountChange={handleDiscountChange}
            />
          )}

          {/* Hybrid Payment Manager */}
          {isHybridPayment && (
            <HybridPaymentManager
              totalAmount={totalAmount}
              cashAmount={cashAmount}
              cardAmount={cardAmount}
              bankTransferAmount={bankTransferAmount}
              onPaymentChange={handlePaymentChange}
            />
          )}

          {/* Sale Totals */}
          {saleItems.length > 0 && (
            <SaleTotals 
              saleItems={saleItems} 
              discountAmount={discountAmount}
              finalSubtotal={finalSubtotal}
              taxAmount={taxAmount}
              totalAmount={totalAmount}
            />
          )}

          {/* Submit Buttons */}
          {saleItems.length > 0 && (
            <div className="flex flex-col gap-3 pt-6 border-t bg-muted/30 -mx-4 px-4 py-4 rounded-b-lg">
              <Button 
                type="submit" 
                disabled={!isFormValid || createSale.isPending}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                size="lg"
              >
                {createSale.isPending ? "Creazione..." : `Crea Garentille - €${totalAmount.toFixed(2)}`}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="w-full h-12 text-base"
                size="lg"
              >
                Annulla
              </Button>
            </div>
          )}
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
    </SalesPermissionGuard>
  );
}
