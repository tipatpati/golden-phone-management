import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug } from 'lucide-react';
import { useSaleCreation } from '@/contexts/SaleCreationContext';

export function VATDebugPanel() {
  const { state } = useSaleCreation();
  const { formData, subtotal, taxAmount, totalAmount } = state;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Bug className="h-4 w-4" />
          Debug Panel - VAT State
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span>VAT Included:</span>
          <Badge variant={formData.vat_included ? "default" : "secondary"}>
            {formData.vat_included ? "TRUE" : "FALSE"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Subtotal:</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Tax Amount:</span>
          <span>€{taxAmount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Total Amount:</span>
          <span>€{totalAmount.toFixed(2)}</span>
        </div>
        <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800">
          <strong>Current Calculation Mode:</strong> {formData.vat_included ? 'VAT Included' : 'VAT Excluded'}
        </div>
      </CardContent>
    </Card>
  );
}