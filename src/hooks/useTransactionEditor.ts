import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  useUpdateSupplierTransaction, 
  useReplaceSupplierTransactionItems, 
  useSupplierTransactionItems 
} from "@/services/suppliers/SupplierTransactionService";
import { useProducts } from "@/services/inventory/InventoryReactQueryService";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import type { SupplierTransaction, EditableTransactionItem } from "@/services/suppliers/types";
import type { ProductUnit, UnitEntryForm as UnitEntryFormType } from "@/services/inventory/types";

export interface TransactionEditorState {
  type: SupplierTransaction["type"];
  status: SupplierTransaction["status"];
  notes: string;
  date: string;
  supplierId: string;
  items: EditableTransactionItem[];
  productUnits: Record<string, ProductUnit[]>;
  itemUnitEntries: Record<number, UnitEntryFormType[]>;
  editingUnits: Record<number, boolean>;
}

export interface TransactionEditorActions {
  updateTransaction: (field: keyof TransactionEditorState, value: any) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: keyof EditableTransactionItem, value: any) => Promise<void>;
  updateUnitEntries: (itemIndex: number, entries: UnitEntryFormType[]) => void;
  toggleUnitEditing: (itemIndex: number) => void;
  calculateItemTotal: (item: EditableTransactionItem, index: number) => number;
  calculateTotal: () => number;
  submitChanges: () => Promise<boolean>;
  reset: () => void;
}

export function useTransactionEditor(
  transaction: SupplierTransaction | null,
  userRole: string | null,
  onSuccess?: () => void
) {
  const { toast } = useToast();
  const { data: products } = useProducts();
  const { data: existingItems, isLoading: loadingItems } = useSupplierTransactionItems(transaction?.id || "");
  const updateTx = useUpdateSupplierTransaction();
  const replaceItems = useReplaceSupplierTransactionItems();

  // State management
  const [state, setState] = useState<TransactionEditorState>({
    type: "purchase",
    status: "pending",
    notes: "",
    date: "",
    supplierId: "",
    items: [{ product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [], product_unit_ids: [] }],
    productUnits: {},
    itemUnitEntries: {},
    editingUnits: {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state from transaction
  const reset = useCallback(() => {
    if (transaction) {
      setState(prev => ({
        ...prev,
        type: transaction.type,
        status: transaction.status,
        notes: transaction.notes || "",
        date: transaction.transaction_date?.split("T")[0] || "",
        supplierId: transaction.supplier_id,
      }));
      setHasChanges(false);
    }
  }, [transaction]);

  useEffect(() => {
    reset();
  }, [reset]);

  // Load existing items and setup unit entries
  useEffect(() => {
    const loadItemsAndUnits = async () => {
      if (!existingItems || !products) return;

      const mappedItems: EditableTransactionItem[] = existingItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        unit_barcodes: item.unit_details?.barcodes || [],
        product_unit_ids: (item as any).product_unit_ids || [],
      }));

      const newProductUnits: Record<string, ProductUnit[]> = {};
      const newItemUnitEntries: Record<number, UnitEntryFormType[]> = {};

      // Load product units for serialized items
      await Promise.all(
        mappedItems.map(async (item, index) => {
          const product = products.find(p => p.id === item.product_id);
          
          if (product?.has_serial && item.product_unit_ids?.length) {
            try {
              const units = await ProductUnitManagementService.getUnitsByIds(item.product_unit_ids);
              newProductUnits[item.product_id] = units;
              
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
              newItemUnitEntries[index] = unitEntries;
            } catch (error) {
              console.error('Failed to load product units:', error);
            }
          }
        })
      );

      setState(prev => ({
        ...prev,
        items: mappedItems,
        productUnits: newProductUnits,
        itemUnitEntries: newItemUnitEntries,
      }));
    };

    loadItemsAndUnits();
  }, [existingItems, products]);

  // Actions
  const updateTransaction = useCallback((field: keyof TransactionEditorState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const addItem = useCallback(() => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [], product_unit_ids: [] }]
    }));
    setHasChanges(true);
  }, []);

  const removeItem = useCallback((index: number) => {
    setState(prev => {
      if (prev.items.length <= 1) return prev;
      
      const newItems = prev.items.filter((_, i) => i !== index);
      const newUnitEntries = { ...prev.itemUnitEntries };
      const newEditingUnits = { ...prev.editingUnits };
      
      // Clean up related state
      delete newUnitEntries[index];
      delete newEditingUnits[index];
      
      return {
        ...prev,
        items: newItems,
        itemUnitEntries: newUnitEntries,
        editingUnits: newEditingUnits,
      };
    });
    setHasChanges(true);
  }, []);

  const updateItem = useCallback(async (index: number, field: keyof EditableTransactionItem, value: any) => {
    setState(prev => {
      const newItems = [...prev.items];
      (newItems[index] as any)[field] = value;
      return { ...prev, items: newItems };
    });

    // Handle product change for serialized products
    if (field === 'product_id' && value && products) {
      const product = products.find(p => p.id === value);
      if (product?.has_serial) {
        try {
          const units = await ProductUnitManagementService.getAvailableUnitsForProduct(value);
          setState(prev => {
            const unitEntries: UnitEntryFormType[] = units.slice(0, prev.items[index].quantity).map(unit => ({
              serial: unit.serial_number || '',
              battery_level: unit.battery_level,
              color: unit.color,
              storage: unit.storage,
              ram: unit.ram,
              price: unit.purchase_price || unit.price || 0,
              min_price: unit.min_price,
              max_price: unit.max_price
            }));

            return {
              ...prev,
              productUnits: { ...prev.productUnits, [value]: units },
              itemUnitEntries: { ...prev.itemUnitEntries, [index]: unitEntries }
            };
          });
        } catch (error) {
          console.error('Failed to load product units:', error);
        }
      }
    }

    // Handle quantity change for serialized products
    if (field === 'quantity' && typeof value === 'number' && products) {
      setState(prev => {
        const item = prev.items[index];
        const product = products.find(p => p.id === item.product_id);
        
        if (product?.has_serial) {
          const units = prev.productUnits[item.product_id] || [];
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
          
          return {
            ...prev,
            itemUnitEntries: { ...prev.itemUnitEntries, [index]: newEntries }
          };
        }
        
        return prev;
      });
    }

    setHasChanges(true);
  }, [products]);

  const updateUnitEntries = useCallback((itemIndex: number, entries: UnitEntryFormType[]) => {
    setState(prev => ({
      ...prev,
      itemUnitEntries: { ...prev.itemUnitEntries, [itemIndex]: entries }
    }));
    setHasChanges(true);
  }, []);

  const toggleUnitEditing = useCallback((itemIndex: number) => {
    setState(prev => ({
      ...prev,
      editingUnits: { ...prev.editingUnits, [itemIndex]: !prev.editingUnits[itemIndex] }
    }));
  }, []);

  const calculateItemTotal = useCallback((item: EditableTransactionItem, index: number) => {
    if (!products) return 0;
    
    const product = products.find(p => p.id === item.product_id);
    if (product?.has_serial && state.itemUnitEntries[index]?.length) {
      return state.itemUnitEntries[index].reduce((sum, entry) => sum + (entry.price || 0), 0);
    }
    return item.quantity * item.unit_cost;
  }, [products, state.itemUnitEntries]);

  const calculateTotal = useCallback(() => {
    return state.items.reduce((sum, item, index) => sum + calculateItemTotal(item, index), 0);
  }, [state.items, calculateItemTotal]);

  const submitChanges = useCallback(async (): Promise<boolean> => {
    if (!transaction || isSubmitting) return false;

    setIsSubmitting(true);
    
    try {
      // Validate items - check for empty strings and falsy values
      const invalidItems = state.items.filter(item => !item.product_id || item.product_id.trim() === '');
      if (invalidItems.length > 0) {
        toast({
          title: "Validation Error",
          description: "Please select a product for all items",
          variant: "destructive",
        });
        return false;
      }

      // Validate supplier is selected
      if (!state.supplierId || state.supplierId.trim() === '') {
        toast({
          title: "Validation Error", 
          description: "Please select a supplier",
          variant: "destructive",
        });
        return false;
      }
      const canEditTransaction = userRole === 'super_admin';

      const total = calculateTotal();
      if (canEditTransaction) {
        await updateTx.mutateAsync({
          id: transaction.id,
          updates: {
            type: state.type,
            status: state.status,
            notes: state.notes,
            transaction_date: state.date,
            total_amount: total,
          },
        });
      }

      // Prepare items with unit IDs for serialized products - filter out invalid items
      const preparedItems = state.items
        .filter(item => item.product_id && item.product_id.trim() !== '') // Ensure valid product_id
        .map((item, index) => {
          if (!products) return item;
          
          const product = products.find(p => p.id === item.product_id);
          const units = state.productUnits[item.product_id] || [];
          
          if (product?.has_serial && units.length >= item.quantity) {
            const selectedUnits = units.slice(0, item.quantity);
            const unitTotal = state.itemUnitEntries[index]?.reduce((sum, entry) => sum + (entry.price || 0), 0) || 0;
            
            return {
              ...item,
              product_unit_ids: selectedUnits.map(unit => unit.id),
              unit_cost: unitTotal / item.quantity || item.unit_cost
            };
          }
          
          return item;
        });

      // Final validation - ensure no empty items made it through
      if (preparedItems.length === 0) {
        toast({
          title: "Validation Error",
          description: "No valid items to save",
          variant: "destructive",
        });
        return false;
      }

      // Replace items
      await replaceItems.mutateAsync({
        transactionId: transaction.id,
        items: preparedItems,
      });

      toast({ 
        title: "Success", 
        description: "Transaction updated successfully" 
      });
      
      setHasChanges(false);
      onSuccess?.();
      return true;

    } catch (error: any) {
      console.error("Update error:", error);
      toast({ 
        title: "Update failed", 
        description: error?.message || 'Unable to update transaction', 
        variant: "destructive" 
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [transaction, state, userRole, products, calculateTotal, updateTx, replaceItems, toast, onSuccess, isSubmitting]);

  const actions: TransactionEditorActions = {
    updateTransaction,
    addItem,
    removeItem,
    updateItem,
    updateUnitEntries,
    toggleUnitEditing,
    calculateItemTotal,
    calculateTotal,
    submitChanges,
    reset,
  };

  return {
    state,
    actions,
    loadingItems,
    isSubmitting,
    hasChanges,
    canEditTransaction: userRole === 'super_admin',
    canEditItems: ['super_admin', 'admin', 'manager', 'inventory_manager'].includes(userRole || ''),
  };
}