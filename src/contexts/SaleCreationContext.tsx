import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StockCalculationService } from '@/services/inventory/StockCalculationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
}

interface SaleCreationState {
  items: SaleItem[];
  formData: SaleFormData;
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
  | { type: 'UPDATE_ITEM'; payload: { product_id: string; updates: Partial<SaleItem> } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_FORM_DATA'; payload: Partial<SaleFormData> }
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
    notes: ''
  },
  stockCache: new Map(),
  isLoading: false,
  validationErrors: [],
  subtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  isValid: false
};

// Reducer
function saleCreationReducer(state: SaleCreationState, action: SaleCreationAction): SaleCreationState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.product_id === action.payload.product_id);
      let newItems: SaleItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }
      
      const newState = { ...state, items: newItems };
      return calculateTotals(newState);
    }

    case 'UPDATE_ITEM': {
      const newItems = state.items.map(item =>
        item.product_id === action.payload.product_id
          ? { ...item, ...action.payload.updates }
          : item
      );
      const newState = { ...state, items: newItems };
      return calculateTotals(newState);
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.product_id !== action.payload);
      const newState = { ...state, items: newItems };
      return calculateTotals(newState);
    }

    case 'UPDATE_FORM_DATA': {
      const newFormData = { ...state.formData, ...action.payload };
      const newState = { ...state, formData: newFormData };
      return calculateTotals(newState);
    }

    case 'UPDATE_STOCK': {
      const newStockCache = new Map([...state.stockCache, ...action.payload]);
      // Update item stock values
      const newItems = state.items.map(item => ({
        ...item,
        stock: newStockCache.get(item.product_id) ?? item.stock
      }));
      return { ...state, stockCache: newStockCache, items: newItems };
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

// Helper function to calculate totals
function calculateTotals(state: SaleCreationState): SaleCreationState {
  const subtotal = state.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  
  let discountAmount = 0;
  if (state.formData.discount_type && state.formData.discount_value > 0) {
    if (state.formData.discount_type === 'percentage') {
      discountAmount = (subtotal * state.formData.discount_value) / 100;
    } else {
      discountAmount = Math.min(state.formData.discount_value, subtotal);
    }
  }

  const finalSubtotal = subtotal - discountAmount;
  const taxAmount = finalSubtotal * 0.22; // 22% IVA
  const totalAmount = finalSubtotal + taxAmount;

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

  const isValid = errors.length === 0;

  return {
    ...state,
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
    validationErrors: errors,
    isValid
  };
}

// Context
interface SaleCreationContextValue {
  state: SaleCreationState;
  addItem: (item: SaleItem) => void;
  updateItem: (productId: string, updates: Partial<SaleItem>) => void;
  removeItem: (productId: string) => void;
  updateFormData: (data: Partial<SaleFormData>) => void;
  refreshStock: (productIds: string[]) => Promise<void>;
  resetSale: () => void;
  validateSale: () => Promise<boolean>;
}

const SaleCreationContext = createContext<SaleCreationContextValue | null>(null);

// Provider
export function SaleCreationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(saleCreationReducer, initialState);
  const { toast } = useToast();

  // Real-time stock updates via Supabase subscriptions
  useEffect(() => {
    const productIds = state.items.map(item => item.product_id);
    if (productIds.length === 0) return;

    // Subscribe to product changes
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
          // Refresh stock for updated product
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
          // Refresh stock for affected product
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
    dispatch({ type: 'ADD_ITEM', payload: item });
    toast({ title: 'Prodotto aggiunto', description: `${item.product_name} aggiunto alla vendita` });
  }, [toast]);

  const updateItem = useCallback((productId: string, updates: Partial<SaleItem>) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { product_id: productId, updates } });
  }, []);

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
    toast({ title: 'Prodotto rimosso', description: 'Prodotto rimosso dalla vendita' });
  }, [toast]);

  const updateFormData = useCallback((data: Partial<SaleFormData>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
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
    toast({ title: 'Vendita azzerata', description: 'Tutti i dati sono stati cancellati' });
  }, [toast]);

  const validateSale = useCallback(async (): Promise<boolean> => {
    // Refresh stock before validation
    const productIds = state.items.map(item => item.product_id);
    if (productIds.length > 0) {
      await refreshStock(productIds);
    }
    
    // Force recalculation
    dispatch({ type: 'CALCULATE_TOTALS' });
    
    return state.isValid;
  }, [state.items, state.isValid, refreshStock]);

  const contextValue: SaleCreationContextValue = {
    state,
    addItem,
    updateItem,
    removeItem,
    updateFormData,
    refreshStock,
    resetSale,
    validateSale
  };

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