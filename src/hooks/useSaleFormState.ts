import { useState, useCallback, useMemo } from 'react';
import { StockCalculationService } from '@/services/inventory/StockCalculationService';
import { useToast } from '@/hooks/use-toast';

export interface SaleItem {
  product_id: string;
  product_name: string;
  brand: string;
  model: string;
  year?: number;
  quantity: number;
  unit_price: number;
  min_price?: number;
  max_price?: number;
  serial_number?: string;
  stock?: number;
}

export interface SaleFormState {
  items: SaleItem[];
  selectedClient: any;
  paymentMethod: string;
  notes: string;
  isLoading: boolean;
  stockCache: Map<string, number>;
}

interface SaleFormActions {
  // Item management
  addItem: (product: any) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  updateItemPrice: (productId: string, price: number) => void;
  updateItemSerial: (productId: string, serialNumber: string) => void;
  
  // Form fields
  setClient: (client: any) => void;
  setPaymentMethod: (method: string) => void;
  setNotes: (notes: string) => void;
  
  // Stock management
  refreshStock: (productIds?: string[]) => Promise<void>;
  getStock: (productId: string) => number;
  
  // Computed values
  totalItems: number;
  subtotal: number;
  
  // Reset
  resetForm: () => void;
}

export function useSaleFormState(): SaleFormState & SaleFormActions {
  const { toast } = useToast();
  
  const [state, setState] = useState<SaleFormState>({
    items: [],
    selectedClient: null,
    paymentMethod: 'cash',
    notes: '',
    isLoading: false,
    stockCache: new Map(),
  });

  // Computed values
  const totalItems = useMemo(() => 
    state.items.reduce((sum, item) => sum + item.quantity, 0), 
    [state.items]
  );

  const subtotal = useMemo(() => 
    state.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0), 
    [state.items]
  );

  // Stock management
  const refreshStock = useCallback(async (productIds?: string[]) => {
    const idsToRefresh = productIds || state.items.map(item => item.product_id);
    if (idsToRefresh.length === 0) return;

    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const stockMap = await StockCalculationService.fetchEffectiveStockBatch(idsToRefresh);
      setState(prev => ({
        ...prev,
        stockCache: new Map([...prev.stockCache, ...stockMap]),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to refresh stock:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare le informazioni di stock",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.items, toast]);

  const getStock = useCallback((productId: string): number => {
    return state.stockCache.get(productId) ?? 0;
  }, [state.stockCache]);

  // Item management
  const addItem = useCallback((product: any) => {
    const existingItem = state.items.find(item => item.product_id === product.id);
    
    if (existingItem) {
      // Update quantity of existing item
      updateItemQuantity(product.id, existingItem.quantity + 1);
      return;
    }

    const newItem: SaleItem = {
      product_id: product.id,
      product_name: `${product.brand} ${product.model}`,
      brand: product.brand,
      model: product.model,
      year: product.year,
      quantity: 1,
      unit_price: product.price || 0,
      min_price: product.min_price,
      max_price: product.max_price,
      serial_number: '',
      stock: product.stock,
    };

    setState(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    // Refresh stock for new item
    refreshStock([product.id]);
  }, [state.items, refreshStock]);

  const removeItem = useCallback((productId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product_id !== productId),
    }));
  }, []);

  const updateItemQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity <= 0) return;

    // Validate against current stock
    const currentStock = await StockCalculationService.fetchEffectiveStock(productId);
    
    if (quantity > currentStock) {
      toast({
        title: "Stock insufficiente",
        description: `Disponibile: ${currentStock}, Richiesto: ${quantity}`,
        variant: "destructive"
      });
      return;
    }

    setState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.product_id === productId
          ? { ...item, quantity }
          : item
      ),
      stockCache: new Map(prev.stockCache.set(productId, currentStock)),
    }));
  }, [toast]);

  const updateItemPrice = useCallback((productId: string, price: number) => {
    if (price <= 0) return;

    setState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.product_id === productId
          ? { ...item, unit_price: price }
          : item
      ),
    }));
  }, []);

  const updateItemSerial = useCallback((productId: string, serialNumber: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.product_id === productId
          ? { ...item, serial_number: serialNumber }
          : item
      ),
    }));
  }, []);

  // Form field setters
  const setClient = useCallback((client: any) => {
    setState(prev => ({ ...prev, selectedClient: client }));
  }, []);

  const setPaymentMethod = useCallback((method: string) => {
    setState(prev => ({ ...prev, paymentMethod: method }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setState(prev => ({ ...prev, notes }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setState({
      items: [],
      selectedClient: null,
      paymentMethod: 'cash',
      notes: '',
      isLoading: false,
      stockCache: new Map(),
    });
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    addItem,
    removeItem,
    updateItemQuantity,
    updateItemPrice,
    updateItemSerial,
    setClient,
    setPaymentMethod,
    setNotes,
    refreshStock,
    getStock,
    resetForm,
    
    // Computed
    totalItems,
    subtotal,
  };
}