import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSuppliers } from "@/services";
import { useCreateSupplierTransaction } from "@/services/suppliers/SupplierTransactionService";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import { Plus, Trash2 } from "lucide-react";
import type { CreateTransactionItemData } from "@/services/suppliers/types";
import type { ProductUnit } from "@/services/inventory/types";

const transactionSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  type: z.enum(["purchase", "payment", "return"]),
  transaction_date: z.string().min(1, "Transaction date is required"),
  notes: z.string().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess: () => void;
}

export function TransactionFormV2({ onSuccess }: TransactionFormProps) {
  const { toast } = useToast();
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts();
  const createTransaction = useCreateSupplierTransaction();
  
  const [items, setItems] = useState<CreateTransactionItemData[]>([
    { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [] }
  ]);
  const [productUnits, setProductUnits] = useState<Record<string, ProductUnit[]>>({});
  const [itemUnitPrices, setItemUnitPrices] = useState<Record<number, number[]>>({});

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      status: "pending",
      transaction_date: new Date().toISOString().split('T')[0],
    },
  });

  const type = watch("type");
  const status = watch("status");

  const addItem = () => {
    setItems(prev => [...prev, { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [] }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = async (index: number, field: keyof CreateTransactionItemData, value: any) => {
    setItems(prev => {
      const newItems = [...prev];
      (newItems[index] as any)[field] = value;
      return newItems;
    });

    // Load units when product changes for serialized products
    if (field === 'product_id' && value) {
      const product = products?.find(p => p.id === value);
      if (product?.has_serial) {
        try {
          const units = await ProductUnitManagementService.getAvailableUnitsForProduct(value);
          setProductUnits(prev => ({ ...prev, [value]: units }));
          
          // Initialize unit prices array for this item
          const defaultPrices = units.slice(0, items[index].quantity).map(unit => 
            unit.purchase_price || unit.price || 0
          );
          setItemUnitPrices(prev => ({ ...prev, [index]: defaultPrices }));
        } catch (error) {
          console.error('Failed to load product units:', error);
        }
      }
    }

    // Update unit prices when quantity changes for serialized products
    if (field === 'quantity' && typeof value === 'number') {
      const item = items[index];
      const product = products?.find(p => p.id === item.product_id);
      if (product?.has_serial) {
        const units = productUnits[item.product_id] || [];
        const newPrices = Array.from({ length: value }, (_, i) => {
          const unit = units[i];
          return unit?.purchase_price || unit?.price || item.unit_cost;
        });
        setItemUnitPrices(prev => ({ ...prev, [index]: newPrices }));
      }
    }
  };

  const parseBarcodes = (text: string): string[] => {
    return text
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const updateUnitPrice = (itemIndex: number, unitIndex: number, price: number) => {
    setItemUnitPrices(prev => {
      const newPrices = { ...prev };
      if (!newPrices[itemIndex]) newPrices[itemIndex] = [];
      newPrices[itemIndex][unitIndex] = price;
      return newPrices;
    });
  };

  const calculateItemTotal = (item: CreateTransactionItemData, index: number) => {
    const product = products?.find(p => p.id === item.product_id);
    if (product?.has_serial && itemUnitPrices[index]?.length) {
      // Use individual unit prices for serialized products
      return itemUnitPrices[index].reduce((sum, price) => sum + price, 0);
    }
    // Use quantity * unit_cost for non-serialized products
    return item.quantity * item.unit_cost;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item, index) => sum + calculateItemTotal(item, index), 0);
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {      
      if (items.some(item => !item.product_id)) {
        toast({
          title: "Validation Error",
          description: "Please select a product for all items",
          variant: "destructive",
        });
        return;
      }

      // Prepare items with unit IDs for serialized products
      const preparedItems = items.map((item, index) => {
        const product = products?.find(p => p.id === item.product_id);
        const units = productUnits[item.product_id] || [];
        
        if (product?.has_serial && units.length >= item.quantity) {
          // Link to specific product units for serialized products
          const selectedUnits = units.slice(0, item.quantity);
          return {
            ...item,
            product_unit_ids: selectedUnits.map(unit => unit.id),
            unit_cost: itemUnitPrices[index]?.reduce((sum, price) => sum + price, 0) / item.quantity || item.unit_cost
          };
        }
        
        return item;
      });

      await createTransaction.mutateAsync({
        supplier_id: data.supplier_id,
        type: data.type,
        transaction_date: data.transaction_date,
        notes: data.notes,
        status: data.status,
        total_amount: 0, // Will be calculated by service
        items: preparedItems,
      });

      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier_id">Supplier *</Label>
          <Select onValueChange={(value) => setValue("supplier_id", value)}>
            <SelectTrigger className={errors.supplier_id ? "border-destructive" : ""}>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              {Array.isArray(suppliers) ? suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              )) : []}
            </SelectContent>
          </Select>
          {errors.supplier_id && (
            <p className="text-sm text-destructive mt-1">{errors.supplier_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Transaction Type *</Label>
          <Select value={type} onValueChange={(value) => setValue("type", value as any)}>
            <SelectTrigger className={errors.type ? "border-destructive" : ""}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="transaction_date">Transaction Date *</Label>
          <Input
            id="transaction_date"
            type="date"
            {...register("transaction_date")}
            className={errors.transaction_date ? "border-destructive" : ""}
          />
          {errors.transaction_date && (
            <p className="text-sm text-destructive mt-1">{errors.transaction_date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value) => setValue("status", value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transaction Items</CardTitle>
            <Button type="button" onClick={addItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="space-y-3 border rounded-lg p-4">
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <Label>Product *</Label>
                  <Select
                    value={item.product_id}
                    onValueChange={(value) => updateItem(index, "product_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg">
                      {(products || []).map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.brand} {product.model} {product.has_serial ? '(serial)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-3">
                  <Label>Unit Cost (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_cost}
                    onChange={(e) => updateItem(index, "unit_cost", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  <Label className="text-xs">Total</Label>
                  <div className="text-sm font-medium py-2">
                    €{calculateItemTotal(item, index).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Show individual unit pricing for serialized products */}
              {(() => {
                const product = products?.find(p => p.id === item.product_id);
                const units = productUnits[item.product_id] || [];
                
                if (product?.has_serial && units.length > 0) {
                  return (
                    <div className="space-y-2">
                      <Label className="text-xs">Individual Unit Prices (€)</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                        {Array.from({ length: item.quantity }, (_, unitIndex) => {
                          const unit = units[unitIndex];
                          const currentPrice = itemUnitPrices[index]?.[unitIndex] || 0;
                          
                          return (
                            <div key={unitIndex} className="flex items-center gap-2 text-xs">
                              <span className="min-w-0 flex-1 truncate">
                                Unit {unitIndex + 1}: {unit?.serial_number || 'TBD'}
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={currentPrice}
                                onChange={(e) => updateUnitPrice(index, unitIndex, parseFloat(e.target.value) || 0)}
                                className="w-20 h-6 text-xs"
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Average: €{itemUnitPrices[index]?.length ? 
                          (itemUnitPrices[index].reduce((sum, price) => sum + price, 0) / itemUnitPrices[index].length).toFixed(2) : 
                          '0.00'
                        }
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div>
                    <Label className="text-xs">Unit Barcodes (optional)</Label>
                    <Textarea
                      placeholder="Enter barcodes separated by comma or new line"
                      value={(item.unit_barcodes || []).join("\n")}
                      onChange={(e) => updateItem(index, "unit_barcodes", parseBarcodes(e.target.value))}
                      rows={2}
                    />
                  </div>
                );
              })()}
            </div>
          ))}
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span>€{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          rows={3}
          placeholder="Additional notes about this transaction..."
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={createTransaction.isPending}>
          {createTransaction.isPending ? "Creating..." : "Create Transaction"}
        </Button>
      </div>
    </form>
  );
}