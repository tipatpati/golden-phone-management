import React from 'react';
import { SaleCreationProvider } from '@/contexts/SaleCreationContext';
import { ProductSearchSection } from './ProductSearchSection';
import { SaleItemsSection } from './SaleItemsSection';
import { PaymentSection } from './PaymentSection';
import { SaleSummarySection } from './SaleSummarySection';

interface SaleFormContainerProps {
  onSaleComplete?: (sale: any) => void;
  onCancel?: () => void;
}

export function SaleFormContainer({ onSaleComplete, onCancel }: SaleFormContainerProps) {
  return (
    <SaleCreationProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Products */}
        <div className="lg:col-span-2 space-y-6">
          <ProductSearchSection />
          <SaleItemsSection />
        </div>

        {/* Right Column - Client, Payment, Totals */}
        <div className="space-y-6">
          <PaymentSection />
          <SaleSummarySection 
            onSaleComplete={onSaleComplete}
            onCancel={onCancel}
          />
        </div>
      </div>
    </SaleCreationProvider>
  );
}