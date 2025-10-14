import React from 'react';
import { SaleCreationProvider, useSaleCreation } from '@/contexts/SaleCreationContext';
import { CleanProductSearchSection } from './CleanProductSearchSection';
import { CleanSaleItemsSection } from './CleanSaleItemsSection';
import { CleanPaymentSection } from './CleanPaymentSection';
import { CleanSaleSummarySection } from './CleanSaleSummarySection';

interface SaleFormContainerProps {
  onSaleComplete?: (sale: any) => void;
  onCancel?: () => void;
  isEditMode?: boolean;
  editingSaleId?: string;
  initialSale?: any;
}

function SaleFormWithDrafts({ onSaleComplete, onCancel, isEditMode, editingSaleId }: SaleFormContainerProps) {
  const { state } = useSaleCreation();

  return (
    <div className="w-full mx-auto bg-surface p-3 sm:p-4 md:p-6 rounded-lg shadow-sm max-w-full sm:max-w-6xl">

      {/* Main Flow - Single Column with Clean Sections */}
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Product Search - Prominent at top */}
        <CleanProductSearchSection />
        
        {/* Stacked layout */}
        <CleanSaleItemsSection />
        <CleanPaymentSection />
        <CleanSaleSummarySection 
          onSaleComplete={onSaleComplete}
          onCancel={onCancel}
          isEditMode={isEditMode}
          editingSaleId={editingSaleId}
        />
      </div>
    </div>
  );
}

export function SaleFormContainer({ onSaleComplete, onCancel, isEditMode, editingSaleId, initialSale }: SaleFormContainerProps) {
  return (
    <SaleCreationProvider initialSale={initialSale}>
      <SaleFormWithDrafts 
        onSaleComplete={onSaleComplete} 
        onCancel={onCancel}
        isEditMode={isEditMode}
        editingSaleId={editingSaleId}
      />
    </SaleCreationProvider>
  );
}