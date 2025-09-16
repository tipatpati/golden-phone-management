import React from 'react';
import { SaleCreationProvider, useSaleCreation } from '@/contexts/SaleCreationContext';
import { CleanProductSearchSection } from './CleanProductSearchSection';
import { CleanSaleItemsSection } from './CleanSaleItemsSection';
import { CleanPaymentSection } from './CleanPaymentSection';
import { CleanSaleSummarySection } from './CleanSaleSummarySection';
import { DraftIndicator } from '@/components/ui/draft-indicator';
import { DraftRestoreDialog } from '@/components/ui/draft-restore-dialog';
import { useSaleAutoSave } from '@/hooks/useSaleAutoSave';

interface SaleFormContainerProps {
  onSaleComplete?: (sale: any) => void;
  onCancel?: () => void;
}

function SaleFormWithDrafts({ onSaleComplete, onCancel }: SaleFormContainerProps) {
  const { state } = useSaleCreation();
  const [showDraftDialog, setShowDraftDialog] = React.useState(false);

  const saleSnapshot = React.useMemo(() => ({
    items: state.items,
    formData: state.formData,
    selectedClient: state.selectedClient
  }), [state.items, state.formData, state.selectedClient]);

  const {
    isDraftAvailable,
    isAutoSaving,
    lastSavedAt,
    restoreDraft,
    deleteDraft,
    metadata
  } = useSaleAutoSave(saleSnapshot, {
    enabled: true,
    onDraftLoaded: (draftData) => {
      // Handle draft restoration logic here
      console.log('Draft loaded:', draftData);
    },
    onError: (error) => {
      console.error('Sale draft error:', error);
    }
  });

  // Check for draft on mount
  React.useEffect(() => {
    if (isDraftAvailable && state.items.length === 0) {
      setShowDraftDialog(true);
    }
  }, [isDraftAvailable, state.items.length]);

  return (
    <div className="max-w-6xl mx-auto bg-surface p-6 rounded-lg shadow-sm">
      {/* Draft Indicator - Top right, subtle */}
      <div className="flex justify-end mb-4">
        <DraftIndicator
          isAutoSaving={isAutoSaving}
          lastSavedAt={lastSavedAt}
          isDraftAvailable={isDraftAvailable}
          onRestoreDraft={() => setShowDraftDialog(true)}
          onClearDraft={deleteDraft}
          className="opacity-60 hover:opacity-100 transition-opacity"
        />
      </div>

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
            />
          </div>
        </div>
      </div>

      {/* Draft Restore Dialog */}
      <DraftRestoreDialog
        isOpen={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        draft={isDraftAvailable ? {
          id: 'sale-draft',
          formType: 'sale',
          timestamp: Date.now(),
          version: '1.0',
          formData: saleSnapshot,
          metadata
        } : null}
        onRestore={() => {
          restoreDraft();
          setShowDraftDialog(false);
        }}
        onDiscard={() => {
          deleteDraft();
          setShowDraftDialog(false);
        }}
      />
    </div>
  );
}

export function SaleFormContainer({ onSaleComplete, onCancel }: SaleFormContainerProps) {
  return (
    <SaleCreationProvider>
      <SaleFormWithDrafts onSaleComplete={onSaleComplete} onCancel={onCancel} />
    </SaleCreationProvider>
  );
}