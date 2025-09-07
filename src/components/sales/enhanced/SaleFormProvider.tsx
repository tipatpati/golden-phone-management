import React, { createContext, useContext, ReactNode } from 'react';
import { useSaleFormState, SaleFormState } from '@/hooks/useSaleFormState';

interface SaleFormActions {
  addItem: (product: any) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  updateItemPrice: (productId: string, price: number) => void;
  updateItemSerial: (productId: string, serialNumber: string) => void;
  setClient: (client: any) => void;
  setPaymentMethod: (method: string) => void;
  setNotes: (notes: string) => void;
  refreshStock: (productIds?: string[]) => Promise<void>;
  getStock: (productId: string) => number;
  resetForm: () => void;
}

type SaleFormContextType = (SaleFormState & SaleFormActions & { 
  totalItems: number; 
  subtotal: number; 
}) | null;

const SaleFormContext = createContext<SaleFormContextType>(null);

interface SaleFormProviderProps {
  children: ReactNode;
}

export function SaleFormProvider({ children }: SaleFormProviderProps) {
  const saleFormState = useSaleFormState();

  return (
    <SaleFormContext.Provider value={saleFormState}>
      {children}
    </SaleFormContext.Provider>
  );
}

export function useSaleForm() {
  const context = useContext(SaleFormContext);
  
  if (!context) {
    throw new Error('useSaleForm must be used within a SaleFormProvider');
  }
  
  return context;
}