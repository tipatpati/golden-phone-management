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
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { 
  useUpdateSupplierTransaction, 
  useReplaceSupplierTransactionItems, 
  useSupplierTransactionItems 
} from "@/services/suppliers/SupplierTransactionService";
import { useToast } from "@/hooks/use-toast";
import type { SupplierTransaction, EditableTransactionItem } from "@/services/suppliers/types";

interface EditTransactionDialogProps {
  transaction: SupplierTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialogV2({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const { userRole } = useAuth();
  const { data: products } = useProducts();
  const { data: existingItems, isLoading: loadingItems } = useSupplierTransactionItems(transaction?.id || "");
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

  // Load transaction data
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setStatus(transaction.status);
      setNotes(transaction.notes || "");
      setDate(transaction.transaction_date?.split("T")[0] || "");
    }
  }, [transaction]);

  // Load existing items
  useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      const mappedItems: EditableTransactionItem[] = existingItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        unit_barcodes: item.unit_details?.barcodes || [],
      }));
      setItems(mappedItems);
    }
  }, [existingItems]);

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

  const parseBarcodes = (text: string): string[] =>
    text
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

  const total = useMemo(() => 
    items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unit_cost || 0)), 0), 
    [items]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    try {
      // Validate items
      if (items.some(item => !item.product_id)) {
        toast({
          title: "Validation Error",
          description: "Please select a product for all items",
          variant: "destructive",
        });
        return;
      }

      // Update transaction (only super_admin can update per RLS)
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

      // Replace items (inventory_manager can also do this per RLS)
      await replaceItems.mutateAsync({
        transactionId: transaction.id,
        items,
      });

      toast({ 
        title: "Success", 
        description: "Transaction updated successfully" 
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Update error:", err);
      toast({ 
        title: "Update failed", 
        description: err?.message || 'Unable to update transaction', 
        variant: "destructive" 
      });
    }
  };

  const canEditTransaction = userRole === 'super_admin';
  const canEditItems = ['super_admin', 'admin', 'manager', 'inventory_manager'].includes(userRole || '');

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction – {transaction.transaction_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Fields */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)} disabled={!canEditTransaction}>
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
              <Select value={status} onValueChange={(v) => setStatus(v as any)} disabled={!canEditTransaction}>
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
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                disabled={!canEditTransaction} 
              />
            </div>
            <div>
              <Label>Total</Label>
              <div className="py-2 font-semibold text-lg">€{total.toFixed(2)}</div>
            </div>
          </div>

          {!canEditTransaction && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              Note: Only super admins can edit transaction details. You can edit items below.
            </div>
          )}

          {/* Transaction Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Transaction Items</CardTitle>
                {canEditItems && (
                  <Button type="button" onClick={addItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Add Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingItems ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading items...</span>
                </div>
              ) : (
                <>
                  {items.map((item, index) => (
                    <div key={index} className="space-y-3 border rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-5">
                          <Label>Product</Label>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateItem(index, "product_id", value)}
                            disabled={!canEditItems}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent className="bg-background border shadow-lg">
                              {(products || []).map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.brand} {p.model} {p.has_serial ? '(serial)' : ''}
                                </SelectItem>
                              ))}
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
                            disabled={!canEditItems}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label>Unit Cost (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.unit_cost}
                            onChange={(e) => updateItem(index, "unit_cost", parseFloat(e.target.value) || 0)}
                            disabled={!canEditItems}
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs">Total</Label>
                          <div className="text-sm font-medium py-2">
                            €{(item.quantity * item.unit_cost).toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-1">
                          {items.length > 1 && canEditItems && (
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

                      <div>
                        <Label className="text-xs">Unit Barcodes (optional)</Label>
                        <Textarea
                          placeholder="Enter barcodes separated by comma or new line"
                          value={(item.unit_barcodes || []).join("\n")}
                          onChange={(e) => updateItem(index, "unit_barcodes", parseBarcodes(e.target.value))}
                          rows={2}
                          disabled={!canEditItems}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end text-lg font-semibold border-t pt-4">
                    <span>Items Total: €{total.toFixed(2)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={3} 
              placeholder="Additional notes..." 
              disabled={!canEditTransaction}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {(canEditTransaction || canEditItems) && (
              <Button 
                type="submit" 
                disabled={updateTx.isPending || replaceItems.isPending}
              >
                {updateTx.isPending || replaceItems.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}