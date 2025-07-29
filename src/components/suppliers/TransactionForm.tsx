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
import { useSuppliers } from "@/services/useSuppliers";
import { useSupplierTransactions } from "@/services/useSupplierTransactions";
import { useProducts } from "@/services/useProducts";
import { Plus, Trash2 } from "lucide-react";

const transactionSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  type: z.enum(["purchase", "payment", "return"]),
  transaction_date: z.string().min(1, "Transaction date is required"),
  notes: z.string().optional(),
  status: z.enum(["pending", "completed", "cancelled"]).default("pending"),
  items: z.array(z.object({
    product_id: z.string().min(1, "Product is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit_cost: z.number().min(0, "Unit cost must be positive"),
  })).min(1, "At least one item is required"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  onSuccess: () => void;
}

export function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { toast } = useToast();
  const { data: suppliers } = useSuppliers();
  const { data: products } = useProducts();
  const { createTransaction } = useSupplierTransactions();
  const [items, setItems] = useState([{ product_id: "", quantity: 1, unit_cost: 0 }]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      status: "pending",
      transaction_date: new Date().toISOString().split('T')[0],
      items: items,
    },
  });

  const type = watch("type");
  const status = watch("status");

  const addItem = () => {
    const newItems = [...items, { product_id: "", quantity: 1, unit_cost: 0 }];
    setItems(newItems);
    setValue("items", newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setValue("items", newItems);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    setValue("items", newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
  };

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const totalAmount = calculateTotal();
      await createTransaction.mutateAsync({
        supplier_id: data.supplier_id,
        type: data.type,
        transaction_date: data.transaction_date,
        notes: data.notes,
        status: data.status,
        total_amount: totalAmount,
        items: data.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      });
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction",
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
            <SelectTrigger className={errors.supplier_id ? "border-red-500" : ""}>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              {suppliers?.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.supplier_id && (
            <p className="text-sm text-red-500 mt-1">{errors.supplier_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="type">Transaction Type *</Label>
          <Select value={type} onValueChange={(value) => setValue("type", value as "purchase" | "payment" | "return")}>
            <SelectTrigger className={errors.type ? "border-red-500" : ""}>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg">
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
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
            className={errors.transaction_date ? "border-red-500" : ""}
          />
          {errors.transaction_date && (
            <p className="text-sm text-red-500 mt-1">{errors.transaction_date.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value) => setValue("status", value as "pending" | "completed" | "cancelled")}>
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
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <Label>Product</Label>
                <Select
                  value={item.product_id}
                  onValueChange={(value) => updateItem(index, "product_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg">
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.brand} {product.model} - {product.serial_numbers?.[0] || product.id.slice(0, 8)}
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
                <Label>Unit Cost</Label>
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
                  ${(item.quantity * item.unit_cost).toFixed(2)}
                </div>
              </div>
              <div className="col-span-1">
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span>${calculateTotal().toFixed(2)}</span>
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Transaction"}
        </Button>
      </div>
    </form>
  );
}