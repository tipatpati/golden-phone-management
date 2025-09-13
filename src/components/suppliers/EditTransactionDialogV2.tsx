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
import { useSuppliers } from "@/services/suppliers/SuppliersReactQueryService";
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
  // ALL HOOKS MUST BE AT THE TOP - NO CONDITIONAL RETURNS BEFORE ALL HOOKS
  const { userRole } = useAuth();
  const { data: products = [], isLoading: productsLoading, error: productsError } = useProducts();
  const { data: suppliers = [], isLoading: suppliersLoading, error: suppliersError } = useSuppliers();
  const { data: existingItems, isLoading: loadingItems } = useSupplierTransactionItems(transaction?.id || "");
  const { toast } = useToast();
  const updateTx = useUpdateSupplierTransaction();
  const replaceItems = useReplaceSupplierTransactionItems();

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
      if (existingItems && existingItems.length > 0 && products.length > 0) {
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
          const product = products.find(p => p.id === item.product_id);
          
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

  // Separate useEffect for loading product units to avoid async hooks violation
  useEffect(() => {
    const loadProductUnits = async () => {
      for (const [productId, units] of Object.entries(productUnits)) {
        if (units.length === 0) { // Only load if array is empty (initialization marker)
          try {
            const loadedUnits = await ProductUnitManagementService.getAvailableUnitsForProduct(productId);
            setProductUnits(prev => ({ ...prev, [productId]: loadedUnits }));
            
            // Find the item index for this product to initialize unit entries
            const itemIndex = items.findIndex(item => item.product_id === productId);
            if (itemIndex >= 0) {
              const unitEntries: UnitEntryFormType[] = loadedUnits.slice(0, items[itemIndex].quantity).map(unit => ({
                serial: unit.serial_number || '',
                battery_level: unit.battery_level,
                color: unit.color,
                storage: unit.storage,
                ram: unit.ram,
                price: unit.purchase_price || unit.price || 0,
                min_price: unit.min_price,
                max_price: unit.max_price
              }));
              setItemUnitEntries(prev => ({ ...prev, [itemIndex]: unitEntries }));
            }
          } catch (error) {
            console.error('Failed to load product units:', error);
          }
        }
      }
    };

    loadProductUnits();
  }, [productUnits, items]);

  // Calculate total using useMemo
  const total = useMemo(() => {
    return items.reduce((sum, item, index) => {
      const product = products.find(p => p.id === item.product_id);
      if (product?.has_serial && itemUnitEntries[index]?.length) {
        // Use individual unit prices for serialized products, fallback to default if no price
        return sum + itemUnitEntries[index].reduce((unitSum, entry) => unitSum + (entry.price || item.unit_cost), 0);
      }
      // Use quantity * unit_cost for non-serialized products
      return sum + (item.quantity * item.unit_cost);
    }, 0);
  }, [items, itemUnitEntries, products]);

  // Determine what to render based on loading and error states
  const isDataLoading = productsLoading || suppliersLoading || !Array.isArray(products) || !Array.isArray(suppliers);
  const hasDataError = productsError || suppliersError;

  // Show loading state
  if (isDataLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Transaction Data...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading products and suppliers...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show error state
  if (hasDataError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Loading Data</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8 text-destructive">
            <span>Failed to load required data. Please refresh and try again.</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [], product_unit_ids: [] }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof EditableTransactionItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      (copy[index] as any)[field] = value;
      
      // Auto-populate unit_cost with product default price when product is selected
      if (field === 'product_id' && value) {
        const product = products.find(p => p.id === value);
        if (product?.price && copy[index].unit_cost === 0) {
          copy[index].unit_cost = product.price;
        }
      }
      
      return copy;
    });

    // Load units when product changes for serialized products (moved to useEffect)
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product?.has_serial) {
        // Trigger async loading via useEffect by updating a dependency
        setProductUnits(prev => ({ ...prev, [value]: [] })); // Initialize empty array to trigger loading
      }
    }

    // Update unit entries when quantity changes for serialized products
    if (field === 'quantity' && typeof value === 'number') {
      const item = items[index];
      const product = products.find(p => p.id === item.product_id);
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
    const product = products.find(p => p.id === item.product_id);
    if (product?.has_serial && itemUnitEntries[index]?.length) {
      // Use individual unit prices for serialized products, fallback to default if no price
      return itemUnitEntries[index].reduce((sum, entry) => sum + (entry.price || item.unit_cost), 0);
    }
    // Use quantity * unit_cost for non-serialized products
    return item.quantity * item.unit_cost;
  };

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

      // Step 1: Create new units for serialized products first
      const preparedItems = await Promise.all(items.map(async (item, index) => {
        const product = products.find(p => p.id === item.product_id);
        const unitEntries = itemUnitEntries[index] || [];
        const existingUnits = productUnits[item.product_id] || [];
        
        if (product?.has_serial && unitEntries.length > 0) {
          // Detect new units (those without existing unit IDs)
          const newUnitEntries = unitEntries.filter(entry => {
            const existingUnit = existingUnits.find(unit => unit.serial_number === entry.serial);
            return !existingUnit || !existingUnit.id;
          });

          let createdUnitIds: string[] = [];
          
          // Create new units if any
          if (newUnitEntries.length > 0) {
            try {
              // Calculate proper default pricing based on hybrid model
              const unitPricesSpecified = newUnitEntries.filter(entry => entry.price && entry.price > 0);
              const hasIndividualPrices = unitPricesSpecified.length > 0;
              
              // Use hybrid pricing model: individual prices + default fallback
              const defaultPricing = hasIndividualPrices ? {
                price: item.unit_cost, // Default product price for units without individual pricing
                min_price: Math.min(...unitPricesSpecified.map(e => e.min_price || e.price || item.unit_cost), item.unit_cost),
                max_price: Math.max(...unitPricesSpecified.map(e => e.max_price || e.price || item.unit_cost), item.unit_cost),
              } : {
                price: item.unit_cost,
                min_price: item.unit_cost,
                max_price: item.unit_cost,
              };

              const createResult = await ProductUnitManagementService.createUnitsForProduct({
                productId: item.product_id,
                unitEntries: newUnitEntries,
                defaultPricing,
                metadata: {
                  supplierId: transaction.supplier_id,
                  transactionId: transaction.id,
                  acquisitionDate: new Date(date)
                }
              });
              
              createdUnitIds = createResult.units.map(unit => unit.id!);
              
              console.log(`Created ${createdUnitIds.length} new units for product ${item.product_id}`);
            } catch (error) {
              console.error('Failed to create new units:', error);
              // More specific error handling - distinguish between critical and recoverable errors
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              if (errorMessage.includes('duplicate') || errorMessage.includes('serial number')) {
                throw new Error(`Duplicate serial number detected for ${product.brand} ${product.model}. Please check serial numbers.`);
              } else if (errorMessage.includes('validation')) {
                throw new Error(`Invalid unit data for ${product.brand} ${product.model}: ${errorMessage}`);
              } else {
                throw new Error(`Failed to create inventory units for ${product.brand} ${product.model}: ${errorMessage}`);
              }
            }
          }

          // Get IDs of existing units that match the serial numbers
          const existingUnitIds = unitEntries
            .map(entry => {
              const existingUnit = existingUnits.find(unit => unit.serial_number === entry.serial);
              return existingUnit?.id;
            })
            .filter(Boolean) as string[];

          // Combine existing and new unit IDs
          const allUnitIds = [...existingUnitIds, ...createdUnitIds];

          // Keep unit_cost as the default product price for hybrid pricing model
          // Individual unit prices are handled separately in calculateItemTotal
          
          return {
            ...item,
            product_unit_ids: allUnitIds,
            unit_cost: item.unit_cost // Keep the default product price
          };
        }
        
        return item;
      }));

      // Step 2: Update transaction (only super_admin can update per RLS)
      let transactionUpdated = false;
      if (userRole === 'super_admin') {
        try {
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
          transactionUpdated = true;
        } catch (transactionError) {
          console.error("Transaction update failed:", transactionError);
          // Continue with items update even if transaction update fails
        }
      }

      // Step 3: Replace transaction items (admin+ can update per RLS)
      let itemsUpdated = false;
      if (userRole === 'super_admin' || userRole === 'admin') {
        try {
          await replaceItems.mutateAsync({
            transactionId: transaction.id,
            items: preparedItems.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_cost: item.unit_cost,
              product_unit_ids: item.product_unit_ids || [],
              unit_barcodes: item.unit_barcodes || [],
            })),
          });
          itemsUpdated = true;
        } catch (itemsError) {
          console.error("Items update failed:", itemsError);
          throw new Error(`Failed to update transaction items: ${itemsError}`);
        }
      }

      // Report success
      if (transactionUpdated && itemsUpdated) {
        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else if (itemsUpdated) {
        toast({
          title: "Partial Success",
          description: "Transaction items updated. Note: Only super admins can update transaction details.",
        });
      } else if (transactionUpdated) {
        toast({
          title: "Partial Success", 
          description: "Transaction details updated. Note: Items update requires admin privileges.",
        });
      } else {
        toast({
          title: "Access Restricted",
          description: "You don't have permission to update this transaction.",
          variant: "destructive",
        });
        return;
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Transaction update error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update transaction",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId} disabled={userRole !== 'super_admin'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(value: SupplierTransaction["type"]) => setType(value)} disabled={userRole !== 'super_admin'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: SupplierTransaction["status"]) => setStatus(value)} disabled={userRole !== 'super_admin'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={userRole !== 'super_admin'}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  disabled={userRole !== 'super_admin'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Transaction Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transaction Items</CardTitle>
              {(userRole === 'super_admin' || userRole === 'admin') && (
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => {
                const product = products.find(p => p.id === item.product_id);
                const isSerializedProduct = product?.has_serial;
                const unitEntries = itemUnitEntries[index] || [];
                const isEditingUnitsForItem = editingUnits[index];
                
                return (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select 
                          value={item.product_id} 
                          onValueChange={(value) => updateItem(index, "product_id", value)}
                          disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.brand} {product.model}
                                {product.has_serial && " (Serialized)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                          disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit Cost (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => updateItem(index, "unit_cost", parseFloat(e.target.value) || 0)}
                          disabled={userRole !== 'super_admin' && userRole !== 'admin'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="p-2 bg-muted rounded text-sm font-medium">
                          €{calculateItemTotal(item, index).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Serialized Product Unit Management */}
                    {isSerializedProduct && (userRole === 'super_admin' || userRole === 'admin') && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Unit Details (Serial Numbers)</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUnitEditing(index)}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            {isEditingUnitsForItem ? 'Close Editor' : 'Edit Units'}
                          </Button>
                        </div>
                        
                        {isEditingUnitsForItem ? (
                          <UnitEntryForm
                            entries={unitEntries}
                            setEntries={(entries) => updateUnitEntries(index, entries)}
                            showPricing={true}
                            title={`Units for ${product.brand} ${product.model}`}
                          />
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {unitEntries.slice(0, item.quantity).map((entry, entryIndex) => (
                              <div key={entryIndex} className="p-2 bg-muted/50 rounded text-sm">
                                <div className="font-medium">{entry.serial || `Unit ${entryIndex + 1}`}</div>
                                {entry.storage && <div className="text-muted-foreground">{entry.storage}GB</div>}
                                {entry.price && <div className="text-muted-foreground">€{entry.price}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Non-serialized Product Barcode Management */}
                    {!isSerializedProduct && (userRole === 'super_admin' || userRole === 'admin') && (
                      <div className="space-y-2 border-t pt-4">
                        <Label>Unit Barcodes (one per line)</Label>
                        <Textarea
                          value={(item.unit_barcodes || []).join('\n')}
                          onChange={(e) => updateItem(index, "unit_barcodes", parseBarcodes(e.target.value))}
                          placeholder="Enter barcodes, one per line..."
                          rows={3}
                        />
                      </div>
                    )}

                    {(userRole === 'super_admin' || userRole === 'admin') && items.length > 1 && (
                      <div className="flex justify-end pt-2">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-semibold">
                  Total: €{total.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateTx.isPending || replaceItems.isPending}
            >
              {(updateTx.isPending || replaceItems.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Update Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
