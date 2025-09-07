import React, { useEffect } from 'react';
import { RefactoredStreamlinedSaleForm } from './RefactoredStreamlinedSaleForm';
import { useSaleForm } from './SaleFormProvider';

interface SaleFormWrapperProps {
  initialItems?: any[];
  initialClient?: any;
  initialPaymentMethod?: string;
  initialNotes?: string;
  onSaleDataChange?: (data: {
    items: any[];
    client: any;
    paymentMethod: string;
    notes: string;
    totalItems: number;
    subtotal: number;
  }) => void;
}

export function SaleFormWrapper({
  initialItems = [],
  initialClient = null,
  initialPaymentMethod = 'cash',
  initialNotes = '',
  onSaleDataChange
}: SaleFormWrapperProps) {
  const {
    items,
    selectedClient,
    paymentMethod,
    notes,
    totalItems,
    subtotal,
    setClient,
    setPaymentMethod,
    setNotes,
    addItem
  } = useSaleForm();

  // Initialize form with provided data
  useEffect(() => {
    if (initialItems.length > 0) {
      initialItems.forEach(item => {
        addItem(item);
      });
    }
    
    if (initialClient) {
      setClient(initialClient);
    }
    
    if (initialPaymentMethod) {
      setPaymentMethod(initialPaymentMethod);
    }
    
    if (initialNotes) {
      setNotes(initialNotes);
    }
  }, []); // Only run on mount

  // Notify parent of data changes
  useEffect(() => {
    if (onSaleDataChange) {
      onSaleDataChange({
        items,
        client: selectedClient,
        paymentMethod,
        notes,
        totalItems,
        subtotal
      });
    }
  }, [items, selectedClient, paymentMethod, notes, totalItems, subtotal, onSaleDataChange]);

  return <RefactoredStreamlinedSaleForm />;
}