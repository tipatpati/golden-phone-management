import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { UnitEntryForm } from '@/components/shared/forms/UnitEntryForm';
import { BarcodeManagementSection } from './BarcodeManagementSection';
import type { AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';
import type { ProductFormData, UnitEntryForm as UnitEntryFormType } from '@/services/inventory/types';

interface UnitManagementSectionProps {
  item: AcquisitionItem;
  index: number;
  onUpdateUnitEntries: (unitEntries: UnitEntryFormType[]) => void;
  onUpdateProductData?: (productData: Partial<ProductFormData>) => void;
  isExistingProduct?: boolean;
}

export function UnitManagementSection({
  item,
  index,
  onUpdateUnitEntries,
  onUpdateProductData,
  isExistingProduct = false
}: UnitManagementSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showBarcodes, setShowBarcodes] = useState(false);

  const title = isExistingProduct 
    ? "New Units to Add (IMEI/SN + pricing)" 
    : "Unit Details (IMEI/SN + pricing)";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-2 w-full justify-start">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-medium">Unit Management</span>
          <span className="text-sm text-muted-foreground">
            ({item.unitEntries.length} units)
          </span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4">
        {/* Unit Entry Form */}
        <UnitEntryForm
          entries={item.unitEntries}
          setEntries={onUpdateUnitEntries}
          onStockChange={(stock) => {
            if (isExistingProduct) {
              // For existing products, update quantity
              // This would need to be handled by parent
            } else if (onUpdateProductData) {
              // For new products, update stock
              onUpdateProductData({ stock });
            }
          }}
          title={title}
          showPricing={true}
          showPricingTemplates={true}
          enablePricingPreview={true}
        />

        {/* Barcode Management Toggle */}
        {item.unitEntries.length > 0 && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBarcodes(!showBarcodes)}
            >
              {showBarcodes ? 'Hide' : 'Show'} Barcode Management
            </Button>
            
            {showBarcodes && (
              <BarcodeManagementSection
                item={item}
                index={index}
              />
            )}
          </div>
        )}

        {/* Pricing Summary for Units */}
        {item.unitEntries.length > 0 && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Units with custom pricing:</span>
                <span>{item.unitEntries.filter(u => u.price && u.price > 0).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total from individual pricing:</span>
                <span>${item.unitEntries.reduce((sum, u) => sum + (u.price || 0), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}