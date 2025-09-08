import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { ReceiptValidationService } from '@/services/sales/ReceiptValidationService';
import type { Sale } from '@/services/sales/types';

interface ReceiptValidationDisplayProps {
  sale: Sale;
  showDetails?: boolean;
}

export function ReceiptValidationDisplay({ sale, showDetails = false }: ReceiptValidationDisplayProps) {
  const report = ReceiptValidationService.generateReceiptReport(sale);
  const { calculations, itemsValidation, overallValid } = report;

  if (overallValid && !showDetails) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Receipt validated</span>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`;

  return (
    <Card className={`${overallValid ? 'border-green-200' : 'border-red-200'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {overallValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          Receipt Validation
          <Badge variant={overallValid ? "default" : "destructive"}>
            {overallValid ? "Valid" : "Invalid"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {report.summary}
        </div>

        {/* Calculations Details */}
        {showDetails && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Items Total (with VAT):</div>
              <div className="font-mono">{formatCurrency(calculations.itemsTotal)}</div>
              
              <div>Subtotal (excl. VAT):</div>
              <div className="font-mono">{formatCurrency(calculations.subtotalWithoutVAT)}</div>
              
              {calculations.discountAmount > 0 && (
                <>
                  <div>Discount:</div>
                  <div className="font-mono text-orange-600">-{formatCurrency(calculations.discountAmount)}</div>
                  
                  <div>Discounted Subtotal:</div>
                  <div className="font-mono">{formatCurrency(calculations.finalSubtotal)}</div>
                </>
              )}
              
              <div>VAT (22%):</div>
              <div className="font-mono">{formatCurrency(calculations.vatAmount)}</div>
              
              <div className="font-semibold">Final Total:</div>
              <div className="font-mono font-semibold">{formatCurrency(calculations.finalTotal)}</div>
              
              <div className="text-muted-foreground">Stored Total:</div>
              <div className="font-mono text-muted-foreground">{formatCurrency(Number(sale.total_amount) || 0)}</div>
            </div>

            {/* Item Count */}
            <div className="flex justify-between text-sm">
              <span>Items in sale:</span>
              <span className="font-mono">{sale.sale_items?.length || 0}</span>
            </div>
          </div>
        )}

        {/* Errors Display */}
        {(!overallValid || showDetails) && (
          <div className="space-y-2">
            {calculations.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">Calculation Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {calculations.errors.map((error, index) => (
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {itemsValidation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">Item Validation Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {itemsValidation.errors.map((error, index) => (
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}