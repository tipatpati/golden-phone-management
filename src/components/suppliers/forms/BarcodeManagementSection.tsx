import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BarcodePreview } from '@/components/inventory/forms/BarcodePreview';
import { UniversalBarcodeManager } from '@/components/shared/UniversalBarcodeManager';
import { logger } from '@/utils/logger';
import type { AcquisitionItem } from '@/services/suppliers/SupplierAcquisitionService';

interface BarcodeManagementSectionProps {
  item: AcquisitionItem;
  index: number;
}

export function BarcodeManagementSection({
  item,
  index
}: BarcodeManagementSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unitBarcodes, setUnitBarcodes] = useState<Record<string, string>>({});
  const [productBarcode, setProductBarcode] = useState<string>('');

  const productData = item.productData || { brand: 'Unknown', model: 'Unknown' };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-2 w-full justify-start">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-medium">Barcode Management</span>
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4">
        {/* Barcode Preview */}
        <BarcodePreview
          unitEntries={item.unitEntries}
          hasSerial={'has_serial' in productData ? productData.has_serial || false : false}
          productBarcode={productBarcode}
        />
        
        {/* Universal Barcode Manager */}
        <UniversalBarcodeManager
          productBrand={productData.brand || 'Unknown'}
          productModel={productData.model || 'Unknown'}
          units={item.unitEntries}
          source="supplier"
          showPrintButton={true}
          onBarcodeGenerated={(serial, barcode) => {
            setUnitBarcodes(prev => ({ ...prev, [serial]: barcode }));
          }}
          onPrintCompleted={(printedUnits) => {
            logger.info('Printed labels for units', { printedUnits }, 'BarcodeManagementSection');
          }}
        />
      </CollapsibleContent>
    </Collapsible>
  );
}