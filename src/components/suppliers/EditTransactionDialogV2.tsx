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
import { Plus, Trash2, Loader2, Edit3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { 
  useUpdateSupplierTransaction, 
  useReplaceSupplierTransactionItems, 
  useSupplierTransactionItems 
} from "@/services/suppliers/SupplierTransactionService";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import { UnitEntryForm } from "@/components/shared/forms/UnitEntryForm";
import { useToast } from "@/hooks/use-toast";
import { useSuppliers } from "@/services";
import type { SupplierTransaction, EditableTransactionItem } from "@/services/suppliers/types";
import type { ProductUnit, UnitEntryForm as UnitEntryFormType } from "@/services/inventory/types";

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
  const { data: suppliers } = useSuppliers();
  const { data: existingItems, isLoading: loadingItems } = useSupplierTransactionItems(transaction?.id || "");
  const { toast } = useToast();

  const [type, setType] = useState<SupplierTransaction["type"]>("purchase");
  const [status, setStatus] = useState<SupplierTransaction["status"]>("pending");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<EditableTransactionItem[]>([
    { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [], product_unit_ids: [] },
  ]);
  const [productUnits, setProductUnits] = useState<Record<string, ProductUnit[]>>({});
  const [itemUnitEntries, setItemUnitEntries] = useState<Record<number, UnitEntryFormType[]>>({});
  const [editingUnits, setEditingUnits] = useState<Record<number, boolean>>({});

  const updateTx = useUpdateSupplierTransaction();
  const replaceItems = useReplaceSupplierTransactionItems();

  // Load transaction data
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setStatus(transaction.status);
      setNotes(transaction.notes || "");
      setDate(transaction.transaction_date?.split("T")[0] || "");
      setSupplierId(transaction.supplier_id);
    }
  }, [transaction]);

  // Load existing items and their product units
  useEffect(() => {
    const loadItemsAndUnits = async () => {
      if (existingItems && existingItems.length > 0) {
        const mappedItems: EditableTransactionItem[] = existingItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          unit_barcodes: item.unit_details?.barcodes || [],
          product_unit_ids: (item as any).product_unit_ids || [],
        }));
        setItems(mappedItems);

        // Load product units for serialized products that have existing unit IDs
        const newProductUnits: Record<string, ProductUnit[]> = {};
        const newItemUnitEntries: Record<number, UnitEntryFormType[]> = {};

        for (let i = 0; i < mappedItems.length; i++) {
          const item = mappedItems[i];
          const product = products?.find(p => p.id === item.product_id);
          
          if (product?.has_serial && item.product_unit_ids?.length > 0) {
            try {
              // Load the specific units that were used in this transaction
              const units = await ProductUnitManagementService.getUnitsByIds(item.product_unit_ids);
              newProductUnits[item.product_id] = units;
              
              // Convert units to unit entry forms for editing
              const unitEntries: UnitEntryFormType[] = units.map(unit => ({
                serial: unit.serial_number || '',
                battery_level: unit.battery_level,
                color: unit.color,
                storage: unit.storage,
                ram: unit.ram,
                price: unit.purchase_price || unit.price || item.unit_cost,
                min_price: unit.min_price,
                max_price: unit.max_price
              }));
              newItemUnitEntries[i] = unitEntries;
            } catch (error) {
              console.error('Failed to load existing product units:', error);
              // Fallback to available units
              try {
                const availableUnits = await ProductUnitManagementService.getAvailableUnitsForProduct(item.product_id);
                newProductUnits[item.product_id] = availableUnits;
                const unitEntries: UnitEntryFormType[] = availableUnits.slice(0, item.quantity).map(unit => ({
                  serial: unit.serial_number || '',
                  battery_level: unit.battery_level,
                  color: unit.color,
                  storage: unit.storage,
                  ram: unit.ram,
                  price: unit.purchase_price || unit.price || item.unit_cost,
                  min_price: unit.min_price,
                  max_price: unit.max_price
                }));
                newItemUnitEntries[i] = unitEntries;
              } catch (fallbackError) {
                console.error('Failed to load available units:', fallbackError);
              }
            }
          }
        }

        setProductUnits(newProductUnits);
        setItemUnitEntries(newItemUnitEntries);
      }
    };

    loadItemsAndUnits();
  }, [existingItems, products]);

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [], product_unit_ids: [] }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = async (index: number, field: keyof EditableTransactionItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      (copy[index] as any)[field] = value;
      return copy;
    });

    // Load units when product changes for serialized products
    if (field === 'product_id' && value) {
      const product = products?.find(p => p.id === value);
      if (product?.has_serial) {
        try {
          const units = await ProductUnitManagementService.getAvailableUnitsForProduct(value);
          setProductUnits(prev => ({ ...prev, [value]: units }));
          
          // Initialize unit entries for this item
          const unitEntries: UnitEntryFormType[] = units.slice(0, items[index].quantity).map(unit => ({
            serial: unit.serial_number || '',
            battery_level: unit.battery_level,
            color: unit.color,
            storage: unit.storage,
            ram: unit.ram,
            price: unit.purchase_price || unit.price || 0,
            min_price: unit.min_price,
            max_price: unit.max_price
          }));
          setItemUnitEntries(prev => ({ ...prev, [index]: unitEntries }));
        } catch (error) {
          console.error('Failed to load product units:', error);
        }
      }
    }

    // Update unit entries when quantity changes for serialized products
    if (field === 'quantity' && typeof value === 'number') {
      const item = items[index];
      const product = products?.find(p => p.id === item.product_id);
      if (product?.has_serial) {
        const units = productUnits[item.product_id] || [];
        const newEntries: UnitEntryFormType[] = Array.from({ length: value }, (_, i) => {
          const unit = units[i];
          return {
            serial: unit?.serial_number || '',
            battery_level: unit?.battery_level,
            color: unit?.color,
            storage: unit?.storage,
            ram: unit?.ram,
            price: unit?.purchase_price || unit?.price || item.unit_cost,
            min_price: unit?.min_price,
            max_price: unit?.max_price
          };
        });
        setItemUnitEntries(prev => ({ ...prev, [index]: newEntries }));
      }
    }
  };

  const parseBarcodes = (text: string): string[] =>
    text
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

  const updateUnitEntries = (itemIndex: number, entries: UnitEntryFormType[]) => {
    setItemUnitEntries(prev => ({
      ...prev,
      [itemIndex]: entries
    }));
  };

  const toggleUnitEditing = (itemIndex: number) => {
    setEditingUnits(prev => ({
      ...prev,
      [itemIndex]: !prev[itemIndex]
    }));
  };

  const calculateItemTotal = (item: EditableTransactionItem, index: number) => {
    const product = products?.find(p => p.id === item.product_id);
    if (product?.has_serial && itemUnitEntries[index]?.length) {
      // Use individual unit prices for serialized products
      return itemUnitEntries[index].reduce((sum, entry) => sum + (entry.price || 0), 0);
    }
    // Use quantity * unit_cost for non-serialized products
    return item.quantity * item.unit_cost;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item, index) => sum + calculateItemTotal(item, index), 0);
  };

  const total = useMemo(() => calculateTotal(), [items, itemUnitEntries]);

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
            unit_cost: itemUnitEntries[index]?.reduce((sum, entry) => sum + (entry.price || 0), 0) / item.quantity || item.unit_cost
          };
        }
        
        return item;
      });

      // Replace items (inventory_manager can also do this per RLS)
      await replaceItems.mutateAsync({
        transactionId: transaction.id,
        items: preparedItems,
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select value={supplierId} onValueChange={(value) => setSupplierId(value)} disabled={!canEditTransaction}>
                <SelectTrigger className="">
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
            </div>

            <div>
              <Label htmlFor="type">Transaction Type *</Label>
              <Select value={type} onValueChange={(value) => setType(value as any)} disabled={!canEditTransaction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg">
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction_date">Transaction Date *</Label>
              <Input
                id="transaction_date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!canEditTransaction}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as any)} disabled={!canEditTransaction}>
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
                            €{calculateItemTotal(item, index).toFixed(2)}
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

                      {/* Show editable product units for serialized products */}
                      {(() => {
                        const product = products?.find(p => p.id === item.product_id);
                        
                        if (product?.has_serial) {
                          const isEditing = editingUnits[index];
                          const unitEntries = itemUnitEntries[index] || [];
                          
                          if (isEditing && unitEntries.length > 0) {
                            return (
                              <div className="space-y-3 border-t pt-3">
                                <div className="flex justify-between items-center">
                                  <Label className="text-sm font-medium">Edit Product Units</Label>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleUnitEditing(index)}
                                    disabled={!canEditItems}
                                  >
                                    Done
                                  </Button>
                                </div>
                                <UnitEntryForm
                                  entries={unitEntries}
                                  setEntries={(entries) => updateUnitEntries(index, entries)}
                                  showPricing={true}
                                  title=""
                                  productId={item.product_id}
                                  className="border-0 p-0"
                                />
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Product Units ({item.quantity})</Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleUnitEditing(index)}
                                  disabled={!canEditItems}
                                  className="h-6 px-2 text-xs"
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Edit Units
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                {unitEntries.length > 0 ? (
                                  <>
                                    {unitEntries.slice(0, 3).map((entry, i) => (
                                      <div key={i} className="flex justify-between">
                                        <span>{entry.serial || `Unit ${i + 1}`}</span>
                                        <span>€{(entry.price || 0).toFixed(2)}</span>
                                      </div>
                                    ))}
                                    {unitEntries.length > 3 && (
                                      <div className="text-center text-muted-foreground mt-1">
                                        +{unitEntries.length - 3} more units
                                      </div>
                                    )}
                                    <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                                      <span>Total:</span>
                                      <span>€{unitEntries.reduce((sum, entry) => sum + (entry.price || 0), 0).toFixed(2)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div>Click "Edit Units" to configure product units</div>
                                )}
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
                              disabled={!canEditItems}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>€{total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes about this transaction..."
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