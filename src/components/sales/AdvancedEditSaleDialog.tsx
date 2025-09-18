import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/common/FormDialog";
import { FormField } from "@/components/common/FormField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Plus, Trash2, User, Calendar } from "lucide-react";
import { useUpdateSale, type Sale, type CreateSaleData } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SimpleClientSelector } from "@/components/sales/SimpleClientSelector";

interface AdvancedEditSaleDialogProps {
  sale: Sale;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

interface EditableSaleItem {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  serial_number?: string;
  product?: {
    id: string;
    brand: string;
    model: string;
    year?: number;
  };
}

export function AdvancedEditSaleDialog({ sale, onSuccess, trigger }: AdvancedEditSaleDialogProps) {
  const { userRole } = useAuth();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [clientId, setClientId] = useState(sale.client_id || "");
  const [salespersonId, setSalespersonId] = useState(sale.salesperson_id);
  const [status, setStatus] = useState(sale.status);
  const [paymentMethod, setPaymentMethod] = useState(sale.payment_method);
  const [paymentType, setPaymentType] = useState(sale.payment_type || "single");
  const [cashAmount, setCashAmount] = useState(sale.cash_amount || 0);
  const [cardAmount, setCardAmount] = useState(sale.card_amount || 0);
  const [bankTransferAmount, setBankTransferAmount] = useState(sale.bank_transfer_amount || 0);
  const [discountAmount, setDiscountAmount] = useState(sale.discount_amount || 0);
  const [discountPercentage, setDiscountPercentage] = useState(sale.discount_percentage || 0);
  const [notes, setNotes] = useState(sale.notes || "");
  const [saleDate, setSaleDate] = useState(sale.sale_date);
  const [saleItems, setSaleItems] = useState<EditableSaleItem[]>(sale.sale_items || []);

  const updateSale = useUpdateSale();

  // Only show for super admins
  if (userRole !== 'super_admin') {
    return null;
  }

  // Reset form when sale changes
  useEffect(() => {
    setClientId(sale.client_id || "");
    setSalespersonId(sale.salesperson_id);
    setStatus(sale.status);
    setPaymentMethod(sale.payment_method);
    setPaymentType(sale.payment_type || "single");
    setCashAmount(sale.cash_amount || 0);
    setCardAmount(sale.card_amount || 0);
    setBankTransferAmount(sale.bank_transfer_amount || 0);
    setDiscountAmount(sale.discount_amount || 0);
    setDiscountPercentage(sale.discount_percentage || 0);
    setNotes(sale.notes || "");
    setSaleDate(sale.sale_date);
    setSaleItems(sale.sale_items || []);
  }, [sale]);

  // Calculate totals
  const subtotal = saleItems.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmountCalc = discountPercentage > 0 ? (subtotal * discountPercentage / 100) : discountAmount;
  const taxableAmount = subtotal - discountAmountCalc;
  const taxAmount = taxableAmount * 0.22; // 22% VAT
  const totalAmount = taxableAmount + taxAmount;

  const handleSubmit = async () => {
    console.log('🔄 Starting sale update submission');
    
    try {
      // Build optimized update data - only include fields that actually changed
      const updateData: Partial<CreateSaleData> = {};
      
      console.log('📊 Current form values:', {
        clientId, salespersonId, status, paymentMethod, paymentType,
        cashAmount, cardAmount, bankTransferAmount, discountAmountCalc, 
        discountPercentage, notes, saleItemsCount: saleItems.length
      });
      
      console.log('📋 Original sale values:', {
        originalClientId: sale.client_id,
        originalStatus: sale.status,
        originalPaymentMethod: sale.payment_method,
        originalPaymentType: sale.payment_type,
        originalCashAmount: sale.cash_amount,
        originalCardAmount: sale.card_amount,
        originalSaleItemsCount: sale.sale_items?.length || 0
      });
      
      // Only include changed fields
      if (clientId !== (sale.client_id || "")) updateData.client_id = clientId || undefined;
      if (salespersonId !== sale.salesperson_id) updateData.salesperson_id = salespersonId;
      if (status !== sale.status) updateData.status = status as any;
      if (paymentMethod !== sale.payment_method) updateData.payment_method = paymentMethod as any;
      if (paymentType !== (sale.payment_type || "single")) updateData.payment_type = paymentType as any;
      if (cashAmount !== (sale.cash_amount || 0)) updateData.cash_amount = cashAmount;
      if (cardAmount !== (sale.card_amount || 0)) updateData.card_amount = cardAmount;
      if (bankTransferAmount !== (sale.bank_transfer_amount || 0)) updateData.bank_transfer_amount = bankTransferAmount;
      if (discountAmountCalc !== (sale.discount_amount || 0)) updateData.discount_amount = discountAmountCalc;
      if (discountPercentage !== (sale.discount_percentage || 0)) updateData.discount_percentage = discountPercentage;
      if (notes !== (sale.notes || "")) updateData.notes = notes;
      
      // Only include sale_items if they actually changed
      const originalItems = sale.sale_items || [];
      const currentItems = saleItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        serial_number: item.serial_number
      }));
      
      if (JSON.stringify(originalItems) !== JSON.stringify(currentItems)) {
        updateData.sale_items = currentItems;
      }

      // If no changes detected, show a message
      if (Object.keys(updateData).length === 0) {
        toast({
          title: "No changes detected",
          description: "No modifications were made to the sale.",
        });
        return;
      }

      console.log('📤 Final update data to send:', updateData);

      await updateSale.mutateAsync({
        id: sale.id,
        data: updateData
      });
      
      console.log('✅ Sale update completed successfully');
      
      // Force immediate refresh
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.refetchQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // In case inventory changed
      
      setOpen(false);
      
      toast({
        title: "Sale updated successfully",
        description: `Sale #${sale.sale_number} has been updated.`,
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('❌ Sale update failed in dialog:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        updateData: error?.updateData || 'Not available'
      });
      
      toast({
        title: "Error updating sale",
        description: error?.message || "Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const updateSaleItemQuantity = (index: number, quantity: number) => {
    const newItems = [...saleItems];
    newItems[index].quantity = quantity;
    newItems[index].total_price = quantity * newItems[index].unit_price;
    setSaleItems(newItems);
  };

  const updateSaleItemPrice = (index: number, price: number) => {
    const newItems = [...saleItems];
    newItems[index].unit_price = price;
    newItems[index].total_price = newItems[index].quantity * price;
    setSaleItems(newItems);
  };

  const removeSaleItem = (index: number) => {
    const newItems = saleItems.filter((_, i) => i !== index);
    setSaleItems(newItems);
  };

  const defaultTrigger = (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 hover:bg-amber-50 hover:text-amber-600 transition-colors"
      onClick={() => setOpen(true)}
    >
      <Edit className="h-4 w-4" />
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}
      
      <FormDialog
        title={`Edit Sale - ${sale.sale_number}`}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        isLoading={updateSale.isPending}
        submitText={updateSale.isPending ? "Updating..." : "Update Sale"}
        maxWidth="2xl"
      >
        <div className="space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Sale Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sale Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sale Date</Label>
                  <Input
                    type="date"
                    value={saleDate ? format(new Date(saleDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                </div>
                <FormField
                  label="Status"
                  type="select"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: "completed", label: "Completed" },
                    { value: "pending", label: "Pending" },
                    { value: "cancelled", label: "Cancelled" },
                    { value: "refunded", label: "Refunded" }
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleClientSelector
                value={clientId}
                onChange={setClientId}
                placeholder="Select a client..."
              />
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Payment Method"
                  type="select"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "card", label: "Card" },
                    { value: "bank_transfer", label: "Bank Transfer" },
                    { value: "hybrid", label: "Hybrid" },
                    { value: "other", label: "Other" }
                  ]}
                />
                <FormField
                  label="Payment Type"
                  type="select"
                  value={paymentType}
                  onChange={(value) => setPaymentType(value as "single" | "hybrid")}
                  options={[
                    { value: "single", label: "Single Payment" },
                    { value: "hybrid", label: "Hybrid Payment" }
                  ]}
                />
              </div>

              {paymentType === "hybrid" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Cash Amount (€)"
                    inputType="number"
                    value={cashAmount.toString()}
                    onChange={(value) => setCashAmount(parseFloat(value) || 0)}
                  />
                  <FormField
                    label="Card Amount (€)"
                    inputType="number"
                    value={cardAmount.toString()}
                    onChange={(value) => setCardAmount(parseFloat(value) || 0)}
                  />
                  <FormField
                    label="Bank Transfer (€)"
                    inputType="number"
                    value={bankTransferAmount.toString()}
                    onChange={(value) => setBankTransferAmount(parseFloat(value) || 0)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sale Items */}
          <Card>
            <CardHeader>
              <CardTitle>Sale Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {saleItems.map((item, index) => (
                  <div key={item.id || index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {item.product?.brand} {item.product?.model}
                          {item.product?.year && ` (${item.product.year})`}
                        </h4>
                        {item.serial_number && (
                          <p className="text-sm text-muted-foreground">
                            Serial: {item.serial_number}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSaleItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField
                        label="Quantity"
                        inputType="number"
                        value={item.quantity.toString()}
                        onChange={(value) => updateSaleItemQuantity(index, parseInt(value) || 1)}
                      />
                      <FormField
                        label="Unit Price (€)"
                        inputType="number"
                        value={item.unit_price.toString()}
                        onChange={(value) => updateSaleItemPrice(index, parseFloat(value) || 0)}
                      />
                      <div>
                        <label className="text-sm font-medium">Total Price</label>
                        <div className="mt-1 px-3 py-2 bg-muted rounded-md">
                          €{item.total_price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Discounts and Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Discounts & Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Discount Percentage (%)"
                  inputType="number"
                  value={discountPercentage.toString()}
                  onChange={(value) => {
                    setDiscountPercentage(parseFloat(value) || 0);
                    setDiscountAmount(0); // Clear fixed amount when using percentage
                  }}
                />
                <FormField
                  label="Discount Amount (€)"
                  inputType="number"
                  value={discountAmount.toString()}
                  onChange={(value) => {
                    setDiscountAmount(parseFloat(value) || 0);
                    setDiscountPercentage(0); // Clear percentage when using fixed amount
                  }}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-€{discountAmountCalc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (22%):</span>
                  <span>€{taxAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>€{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                label="Additional Notes"
                type="textarea"
                value={notes}
                onChange={setNotes}
                placeholder="Add any additional notes about this sale..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      </FormDialog>
    </>
  );
}