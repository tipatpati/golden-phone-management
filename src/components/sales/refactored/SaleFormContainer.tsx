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
    <div className="max-w-6xl mx-auto bg-surface p-6 rounded-lg shadow-sm">

      {/* Main Flow - Single Column with Clean Sections */}
      <div className="space-y-8">
        {/* Product Search - Prominent at top */}
        <CleanProductSearchSection />
        
        {/* Two-column layout for items and summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sale Items - Takes more space */}
          <div className="lg:col-span-2">
            <CleanSaleItemsSection />
          </div>
          
          {/* Payment & Summary - Compact sidebar */}
          <div className="space-y-6">
            <CleanPaymentSection />
            <CleanSaleSummarySection 
              onSaleComplete={onSaleComplete}
              onCancel={onCancel}
              isEditMode={isEditMode}
              editingSaleId={editingSaleId}
            />
          </div>
        </div>
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