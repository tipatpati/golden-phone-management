import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { ProductUnitManagementService } from "@/services/shared/ProductUnitManagementService";
import type { EditableTransactionItem } from "@/services/suppliers/types";
import type { ProductUnit, UnitEntryForm as UnitEntryFormType } from "@/services/inventory/types";

interface UseEditTransactionDialogProps {
  products: any[];
  existingItems: any[] | undefined;
  onItemsChange: (items: EditableTransactionItem[]) => void;
}

export function useEditTransactionDialog({ 
  products, 
  existingItems, 
  onItemsChange 
}: UseEditTransactionDialogProps) {
  const { toast } = useToast();
  
  const [items, setItems] = useState<EditableTransactionItem[]>([
    { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [], product_unit_ids: [] },
  ]);
  const [productUnits, setProductUnits] = useState<Record<string, ProductUnit[]>>({});
  const [itemUnitEntries, setItemUnitEntries] = useState<Record<number, UnitEntryFormType[]>>({});
  const [editingUnits, setEditingUnits] = useState<Record<number, boolean>>({});

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
        onItemsChange(mappedItems);

        // Load product units for serialized products
        const newProductUnits: Record<string, ProductUnit[]> = {};
        const newItemUnitEntries: Record<number, UnitEntryFormType[]> = {};

        for (let i = 0; i < mappedItems.length; i++) {
          const item = mappedItems[i];
          const product = products.find(p => p.id === item.product_id);
          
          if (product?.has_serial && item.product_unit_ids?.length > 0) {
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
              newItemUnitEntries[i] = unitEntries;
            } catch (error) {
              console.error('Failed to load existing product units:', error);
              toast({
                title: "Warning",
                description: "Some product unit data could not be loaded",
                variant: "destructive"
              });
            }
          }
        }

        setProductUnits(newProductUnits);
        setItemUnitEntries(newItemUnitEntries);
      }
    };

    loadItemsAndUnits();
  }, [existingItems, products, onItemsChange, toast]);

  const updateItem = async (index: number, field: keyof EditableTransactionItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto-populate unit_cost with product default price when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product?.price && newItems[index].unit_cost === 0) {
        newItems[index].unit_cost = product.price;
      }
    }
    
    setItems(newItems);
    onItemsChange(newItems);

    // Load units when product changes for serialized products
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product?.has_serial) {
        try {
          const units = await ProductUnitManagementService.getAvailableUnitsForProduct(value);
          setProductUnits(prev => ({ ...prev, [value]: units }));
          
          const unitEntries: UnitEntryFormType[] = units.slice(0, newItems[index].quantity).map(unit => ({
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
          toast({
            title: "Error",
            description: "Failed to load product units",
            variant: "destructive"
          });
        }
      }
    }

    // Update unit entries when quantity changes for serialized products
    if (field === 'quantity' && typeof value === 'number') {
      const item = newItems[index];
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

  const addItem = () => {
    const newItems = [...items, { product_id: "", quantity: 1, unit_cost: 0, unit_barcodes: [], product_unit_ids: [] }];
    setItems(newItems);
    onItemsChange(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      onItemsChange(newItems);
    }
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

  return {
    items,
    productUnits,
    itemUnitEntries,
    editingUnits,
    updateItem,
    updateUnitEntries,
    toggleUnitEditing,
    addItem,
    removeItem,
    calculateItemTotal
  };
}