import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockCalculationService } from '@/services/inventory/StockCalculationService';
import { useToast } from '@/hooks/use-toast';
import { getEnforcedQuantity } from '@/utils/saleItemsUtils';
import { debugLog } from '@/utils/debug';

// Types
export interface SaleItem {
  product_id: string;
  product_unit_id?: string;
  product_name: string;
  brand: string;
  model: string;
  year?: number;
  quantity: number;
  unit_price: number;
  min_price?: number;
  max_price?: number;
  serial_number?: string;
  barcode?: string;
  has_serial?: boolean;
  stock: number;
  discount_type?: 'percentage' | 'amount' | null;
  discount_value?: number;
  discount_amount?: number;
}

export interface SaleFormData {
  client_id?: string;
  payment_method: string;
  payment_type?: 'single' | 'hybrid';
  cash_amount: number;
  card_amount: number;
  bank_transfer_amount: number;
  discount_type?: 'percentage' | 'amount' | null;
  discount_value: number;
  notes: string;
  vat_included: boolean;
}

interface SaleCreationState {
  items: SaleItem[];
  formData: SaleFormData;
  selectedClient: any | null;
  stockCache: Map<string, number>;
  isLoading: boolean;
  validationErrors: string[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  isValid: boolean;
}

// Action types
type SaleCreationAction =
  | { type: 'ADD_ITEM'; payload: SaleItem }
  | { type: 'INIT_ITEMS'; payload: SaleItem[] } // New action for bulk initialization
  | { type: 'UPDATE_ITEM'; payload: { product_id: string; serial_number?: string; product_unit_id?: string; updates: Partial<SaleItem> } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<SaleFormData> }
  | { type: 'SET_SELECTED_CLIENT'; payload: any | null }
  | { type: 'UPDATE_STOCK'; payload: Map<string, number> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_VALIDATION_ERRORS'; payload: string[] }
  | { type: 'CALCULATE_TOTALS' }
  | { type: 'RESET_SALE' };

// Initial state
const initialState: SaleCreationState = {
  items: [],
  formData: {
    payment_method: 'cash',
    payment_type: 'single',
    cash_amount: 0,
    card_amount: 0,
    bank_transfer_amount: 0,
    discount_type: null,
    discount_value: 0,
    notes: '',
    vat_included: true
  },
  selectedClient: null,
  stockCache: new Map(),
  isLoading: false,
  validationErrors: [],
  subtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  isValid: false
};

// Helper function to calculate totals - optimized to minimize overhead
function calculateTotals(state: SaleCreationState): SaleCreationState {
  debugLog('Calculating totals for items:', state.items.length, 'VAT included:', state.formData.vat_included);

  // Calculate item totals including item-level discounts
  const itemsTotal = state.items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    let itemDiscount = 0;
    
    // Calculate item-level discount
    if (item.discount_type && item.discount_value && item.discount_value > 0) {
      if (item.discount_type === 'percentage') {
        itemDiscount = (itemSubtotal * item.discount_value) / 100;
      } else {
        itemDiscount = Math.min(item.discount_value, itemSubtotal);
      }
    }
    
    return sum + (itemSubtotal - itemDiscount);
  }, 0);

  let baseSubtotal: number;
  let taxAmount: number;
  let totalBeforeDiscount: number;

  if (state.formData.vat_included) {
    // Prices include 22% VAT - extract base price
    baseSubtotal = itemsTotal / 1.22;
    taxAmount = baseSubtotal * 0.22;
    totalBeforeDiscount = itemsTotal;
  } else {
    // Prices exclude VAT - add VAT
    baseSubtotal = itemsTotal;
    taxAmount = baseSubtotal * 0.22;
    totalBeforeDiscount = baseSubtotal + taxAmount;
  }

  debugLog('Calculation mode:', state.formData.vat_included ? 'VAT Included' : 'VAT Excluded');
  debugLog('Base Subtotal:', baseSubtotal, 'Tax:', taxAmount, 'Total before discount:', totalBeforeDiscount);
  
  let discountAmount = 0;
  let subtotalAfterDiscount = baseSubtotal;
  let totalAmount = totalBeforeDiscount;

  // Apply discount based on type
  if (state.formData.discount_type && state.formData.discount_value > 0) {
    if (state.formData.discount_type === 'percentage') {
      // Percentage discounts: Apply to subtotal (before VAT)
      discountAmount = (baseSubtotal * state.formData.discount_value) / 100;
      subtotalAfterDiscount = baseSubtotal - discountAmount;
      taxAmount = subtotalAfterDiscount * 0.22; // Recalculate tax on discounted subtotal
      totalAmount = subtotalAfterDiscount + taxAmount;
    } else {
      // Euro amount discounts: Apply to total (after VAT)
      discountAmount = Math.min(state.formData.discount_value, totalBeforeDiscount);
      totalAmount = totalBeforeDiscount - discountAmount;
      // Keep original subtotal and tax amounts for display
      subtotalAfterDiscount = baseSubtotal;
      taxAmount = baseSubtotal * 0.22;
    }
  }

  debugLog('Discount calculation:', {
    discountType: state.formData.discount_type,
    discountValue: state.formData.discount_value,
    baseSubtotal: baseSubtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    subtotalAfterDiscount: subtotalAfterDiscount.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2)
  });

  // Validation
  const errors: string[] = [];
  if (state.items.length === 0) {
    errors.push('Aggiungi almeno un prodotto');
  }

  // Stock validation
  state.items.forEach(item => {
    if (!item.has_serial && item.quantity > item.stock) {
      errors.push(`Stock insufficiente per ${item.product_name}`);
    }
  });

  // Payment validation for hybrid
  if (state.formData.payment_method === 'hybrid') {
    const totalPaid = state.formData.cash_amount + state.formData.card_amount + state.formData.bank_transfer_amount;
    if (Math.abs(totalPaid - totalAmount) > 0.01) {
      errors.push('Il pagamento ibrido deve corrispondere al totale');
    }
  }

  // Discount validation - max amount based on discount type
  if (state.formData.discount_type === 'amount' && state.formData.discount_value > totalBeforeDiscount) {
    errors.push('Lo sconto non può essere superiore al totale');
  }

  const isValid = errors.length === 0;

  return {
    ...state,
    subtotal: baseSubtotal, // Original subtotal before discount
    discountAmount,
    taxAmount,
    totalAmount,
    validationErrors: errors,
    isValid
  };
}

// Reducer - optimized to minimize unnecessary calculations
function saleCreationReducer(state: SaleCreationState, action: SaleCreationAction): SaleCreationState {
  debugLog('Reducer action:', action.type);
  
  switch (action.type) {
    case 'ADD_ITEM': {
      debugLog('ADD_ITEM - New item:', action.payload.product_name);

      // For serialized products, check by serial number; for non-serialized, check by product_id
      const existingItemIndex = action.payload.has_serial
        ? state.items.findIndex(item =>
            item.product_id === action.payload.product_id &&
            item.serial_number === action.payload.serial_number
          )
        : state.items.findIndex(item =>
            item.product_id === action.payload.product_id &&
            !item.has_serial
          );

      let newItems: SaleItem[];

      if (existingItemIndex >= 0) {
        // If exact same item exists (same product + serial for serialized, or same product for non-serialized)
        const existingItem = state.items[existingItemIndex];
        if (existingItem.has_serial) {
          debugLog('Cannot add duplicate serialized item with same serial number:', action.payload.serial_number);
          return state; // Return unchanged state - same unit already added
        }

        debugLog('Updating existing non-serialized item quantity');
        const enforcedQuantity = getEnforcedQuantity(existingItem.has_serial || false, action.payload.quantity);
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + enforcedQuantity }
            : item
        );
      } else {
        debugLog('Adding new item to list');
        // Enforce quantity = 1 for serialized products
        const enforcedItem = {
          ...action.payload,
          quantity: getEnforcedQuantity(action.payload.has_serial || false, action.payload.quantity)
        };
        newItems = [...state.items, enforcedItem];
      }

      debugLog('New items array length:', newItems.length);
      const newState = { ...state, items: newItems };
      return calculateTotals(newState);
    }

    case 'INIT_ITEMS': {
      // Bulk initialization for edit mode - sets items directly without grouping logic
      debugLog('INIT_ITEMS - Loading items for edit mode:', action.payload.length);
      const newState = { ...state, items: action.payload };
      return calculateTotals(newState);
    }

    case 'UPDATE_ITEM': {
      const newItems = state.items.map(item => {
        // Match by product_id AND (serial_number if serialized OR product_unit_id if present)
        const isTargetItem = item.product_id === action.payload.product_id &&
          (item.has_serial 
            ? item.serial_number === action.payload.serial_number || item.product_unit_id === action.payload.product_unit_id
            : !action.payload.serial_number && !action.payload.product_unit_id
          );
        
        if (isTargetItem) {
          const updates = { ...action.payload.updates };
          // Enforce quantity = 1 for serialized products
          if (item.has_serial && updates.quantity !== undefined) {
            updates.quantity = getEnforcedQuantity(true, updates.quantity);
          }
          return { ...item, ...updates };
        }
        return item;
      });
      const newState = { ...state, items: newItems };
      return calculateTotals(newState);
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product_id !== action.payload);
      const newState = { ...state, items: newItems };
      return calculateTotals(newState);
    }

    case 'UPDATE_FORM_DATA': {
      debugLog('Reducer UPDATE_FORM_DATA - payload:', action.payload);
      const newFormData = { ...state.formData, ...action.payload };

      // Special logging for VAT changes
      if (action.payload.vat_included !== undefined) {
        debugLog('VAT MODE CHANGE:', {
          oldValue: state.formData.vat_included,
          newValue: action.payload.vat_included
        });
      }

      const newState = { ...state, formData: newFormData };
      return calculateTotals(newState);
    }

    case 'SET_SELECTED_CLIENT': {
      const newFormData = { ...state.formData, client_id: action.payload?.id };
      // Client selection doesn't affect totals - skip recalculation
      return { ...state, selectedClient: action.payload, formData: newFormData };
    }

    case 'UPDATE_STOCK': {
      const newStockCache = new Map([...state.stockCache, ...action.payload]);
      // Don't auto-update item stock values - preserve initial stock from when added
      // Only update stockCache for reference, not the items themselves
      return { ...state, stockCache: newStockCache };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };

    case 'CALCULATE_TOTALS':
      return calculateTotals(state);

    case 'RESET_SALE':
      return { ...initialState, stockCache: state.stockCache };

    default:
      return state;
  }
}

// Context
interface SaleCreationContextValue {
  state: SaleCreationState;
  addItem: (item: SaleItem) => void;
  updateItem: (productId: string, updates: Partial<SaleItem>, serialNumber?: string, productUnitId?: string) => void;
  removeItem: (productId: string) => void;
  updateFormData: (data: Partial<SaleFormData>) => void;
  setSelectedClient: (client: any | null) => void;
  refreshStock: (productIds: string[]) => Promise<void>;
  resetSale: () => void;
  validateSale: () => Promise<boolean>;
}

const SaleCreationContext = createContext<SaleCreationContextValue | null>(null);

// Provider
interface SaleCreationProviderProps {
  children: React.ReactNode;
  initialSale?: any; // Existing sale data for edit mode
}

export function SaleCreationProvider({ children, initialSale }: SaleCreationProviderProps) {
  const [state, dispatch] = useReducer(saleCreationReducer, initialState);
  const { toast } = useToast();

  // Initialize with existing sale data if provided
  useEffect(() => {
    if (!initialSale) return;
    
    debugLog('Initializing edit mode with sale:', initialSale.id);
    debugLog('Sale items to load:', initialSale.sale_items);
    
    // Reset first to ensure clean state
    dispatch({ type: 'RESET_SALE' });
    
    // Load sale items - use INIT_ITEMS to preserve exact item structure from database
    if (initialSale.sale_items && initialSale.sale_items.length > 0) {
      const loadedItems: SaleItem[] = initialSale.sale_items.map((item: any) => {
        debugLog('Loading sale item:', {
          product_id: item.product_id,
          quantity: item.quantity,
          serial: item.serial_number,
          unit_id: item.product_unit_id
        });
        
        return {
          product_id: item.product_id,
          product_unit_id: item.product_unit_id || undefined,
          product_name: `${item.product?.brand || ''} ${item.product?.model || ''}`.trim(),
          brand: item.product?.brand || '',
          model: item.product?.model || '',
          year: item.product?.year,
          quantity: item.quantity || 1,
          unit_price: Number(item.unit_price) || 0,
          min_price: item.product?.min_price ? Number(item.product.min_price) : undefined,
          max_price: item.product?.max_price ? Number(item.product.max_price) : undefined,
          serial_number: item.serial_number || undefined,
          barcode: item.barcode || undefined,
          has_serial: item.product?.has_serial || false,
          stock: 0, // Will be refreshed immediately
        };
      });
      
      debugLog('Initializing with items:', loadedItems.length);
      dispatch({ type: 'INIT_ITEMS', payload: loadedItems });
    }
    
    // Load form data
    const formData: Partial<SaleFormData> = {
      client_id: initialSale.client_id,
      payment_method: initialSale.payment_method,
      payment_type: initialSale.payment_type || 'single',
      cash_amount: initialSale.cash_amount || 0,
      card_amount: initialSale.card_amount || 0,
      bank_transfer_amount: initialSale.bank_transfer_amount || 0,
      discount_type: initialSale.discount_percentage > 0 ? 'percentage' : 
                     initialSale.discount_amount > 0 ? 'amount' : null,
      discount_value: initialSale.discount_percentage > 0 ? initialSale.discount_percentage : 
                      initialSale.discount_amount || 0,
      notes: initialSale.notes || '',
      vat_included: initialSale.vat_included ?? true
    };
    dispatch({ type: 'UPDATE_FORM_DATA', payload: formData });
    
    // Load client if exists
    if (initialSale.client) {
      dispatch({ type: 'SET_SELECTED_CLIENT', payload: initialSale.client });
    }
  }, [initialSale]);

  debugLog('SaleCreationProvider rendering with state:', {
    itemsCount: state.items.length,
    subtotal: state.subtotal,
    totalAmount: state.totalAmount,
    isValid: state.isValid
  });

  // Real-time stock updates via Supabase subscriptions
  useEffect(() => {
    const productIds = state.items.map(item => item.product_id);
    debugLog('Setting up subscriptions for products:', productIds);
    if (productIds.length === 0) return;

    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=in.(${productIds.join(',')})`
        },
        async (payload) => {
          console.log('Product updated:', payload);
          if (payload.new?.id) {
            await refreshStock([payload.new.id]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'product_units',
          filter: `product_id=in.(${productIds.join(',')})`
        },
        async (payload) => {
          console.log('Product unit updated:', payload);
          if (payload.new?.product_id) {
            await refreshStock([payload.new.product_id]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state.items]);

  // Actions
  const addItem = useCallback((item: SaleItem) => {
    console.log('➕ Adding item:', item);
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const updateItem = useCallback((productId: string, updates: Partial<SaleItem>, serialNumber?: string, productUnitId?: string) => {
    console.log('🔄 Updating item:', productId, updates, serialNumber, productUnitId);
    dispatch({ type: 'UPDATE_ITEM', payload: { product_id: productId, serial_number: serialNumber, product_unit_id: productUnitId, updates } });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
    toast({ title: "Prodotto rimosso", description: "Prodotto rimosso dalla garentille" });
  }, [toast]);

  const updateFormData = useCallback((data: Partial<SaleFormData>) => {
    console.log('📝 Updating form data:', data);
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
  }, []);

  const setSelectedClient = useCallback((client: any | null) => {
    console.log('👤 Setting selected client:', client);
    dispatch({ type: 'SET_SELECTED_CLIENT', payload: client });
  }, []);

  const refreshStock = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const stockMap = await StockCalculationService.fetchEffectiveStockBatch(productIds);
      dispatch({ type: 'UPDATE_STOCK', payload: stockMap });
    } catch (error) {
      console.error('Failed to refresh stock:', error);
      toast({ 
        title: 'Errore', 
        description: 'Impossibile aggiornare lo stock', 
        variant: 'destructive' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [toast]);

  const resetSale = useCallback(() => {
    dispatch({ type: 'RESET_SALE' });
    toast({ title: "Garentille azzerata", description: "Tutti i dati sono stati cancellati" });
  }, [toast]);

  const validateSale = useCallback(async (): Promise<boolean> => {
    // Don't refresh stock automatically - trust initial values
    // Server-side validation in create_sale_transaction is authoritative
    dispatch({ type: 'CALCULATE_TOTALS' });
    return state.isValid;
  }, [state.isValid]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SaleCreationContextValue>(() => ({
    state,
    addItem,
    updateItem,
    removeItem,
    updateFormData,
    setSelectedClient,
    refreshStock,
    resetSale,
    validateSale
  }), [state, addItem, updateItem, removeItem, updateFormData, setSelectedClient, refreshStock, resetSale, validateSale]);

  return (
    <SaleCreationContext.Provider value={contextValue}>
      {children}
    </SaleCreationContext.Provider>
  );
}

// Hook
export function useSaleCreation() {
  const context = useContext(SaleCreationContext);
  if (!context) {
    throw new Error('useSaleCreation must be used within a SaleCreationProvider');
  }
  return context;
}
