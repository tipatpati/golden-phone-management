import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { useUpdateSupplierTransaction, useReplaceSupplierTransactionItems, EditableTransactionItem } from "@/services/useSupplierTransactions";
import { useToast } from "@/hooks/use-toast";

interface SupplierTransaction {
  id: string;
  transaction_number: string;
  type: "purchase" | "payment" | "return";
  status: "pending" | "completed" | "cancelled";
  total_amount: number;
  transaction_date: string;
  notes?: string;
}

interface EditTransactionDialogProps {
  transaction: SupplierTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const { userRole } = useAuth();
  const { data: products } = useProducts();
  const { toast } = useToast();

  const [type, setType] = useState<SupplierTransaction["type"]>("purchase");
  const [status, setStatus] = useState<SupplierTransaction["status"]>("pending");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");

  const [items, setItems] = useState<EditableTransactionItem[]>([
    { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [] },
  ]);

  const updateTx = useUpdateSupplierTransaction();
  const replaceItems = useReplaceSupplierTransactionItems();

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setStatus(transaction.status);
      setNotes(transaction.notes || "");
      setDate(transaction.transaction_date?.split("T")[0] || "");
    }
  }, [transaction]);

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [] }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof EditableTransactionItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      (copy[index] as any)[field] = value;
      return copy;
    });
  };

  // Legacy barcode parsing - kept for backward compatibility only
  const parseBarcodes = (text: string) =>
    text
      .split(/\n|,/) // split by comma or newline
      .map((s) => s.trim())
      .filter(Boolean);

  const total = useMemo(() => items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unit_cost || 0)), 0), [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    try {
      // Only super_admin can update the transaction record per RLS
      if (userRole === 'super_admin') {
        await updateTx.mutateAsync({
          id: transaction.id,
          updates: {
            type,
            status,
            notes,
            transaction_date: date,
            total_amount: total,
          },
        });
      }

      // Replace items regardless (items policy allows inventory_manager too)
      await replaceItems.mutateAsync({
        transaction_id: transaction.id,
        items,
      });

      toast({ title: "Saved", description: "Transaction updated successfully" });
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Update failed", description: err?.message || 'Unable to update transaction', variant: "destructive" });
    }
  };

  // If not allowed to edit top-level fields, we'll disable them but still allow items if role permits
  const canEditTop = userRole === 'super_admin';

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Transaction – {transaction.transaction_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)} disabled={!canEditTop}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg">
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)} disabled={!canEditTop}>
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
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!canEditTop} />
            </div>
            <div>
              <Label>Total</Label>
              <div className="py-2 font-semibold">€{total.toFixed(2)}</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Items, Product Units and Barcodes</CardTitle>
                <Button type="button" onClick={addItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="space-y-2 border rounded-md p-3">
                  <div className="grid grid-cols-12 gap-2 items-end">
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
                          {Array.isArray(products) ? products.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.brand} {p.model} {p.has_serial ? '(serialized)' : ''}
                            </SelectItem>
                          )) : []}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Unit Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        value={item.unit_cost}
                        onChange={(e) => updateItem(index, "unit_cost", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Total</Label>
                      <div className="text-sm font-medium py-2">€{(item.quantity * item.unit_cost).toFixed(2)}</div>
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Unit Management with Universal Barcode Service */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Unit Management</Label>
                    <div className="p-3 bg-muted/30 rounded-md">
                      <div className="text-sm text-muted-foreground mb-2">
                        Barcodes are now automatically generated using the Universal Barcode Service.
                        Unit barcodes will be created when the transaction is completed.
                      </div>
                      {item.unit_barcodes && item.unit_barcodes.length > 0 && (
                        <div className="text-xs">
                          <span className="font-medium">Legacy barcodes:</span>
                          <div className="mt-1 space-x-1">
                            {item.unit_barcodes.map((barcode, idx) => (
                              <span key={idx} className="inline-block px-2 py-1 bg-background rounded text-xs font-mono">
                                {barcode}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end text-base font-semibold">
                <span>Items Total: €{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTx.isPending || replaceItems.isPending}>
              {updateTx.isPending || replaceItems.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}