import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { ValidationError } from '../hooks/useAcquisitionValidation';

interface ValidationErrorSummaryProps {
  isValid: boolean;
  totalErrors: number;
  hasRequiredFieldErrors: boolean;
  hasPricingErrors: boolean;
  hasSerialErrors: boolean;
  errors: ValidationError[];
  onScrollToFirstError: () => void;
  itemCount: number;
}

export function ValidationErrorSummary({
  isValid,
  totalErrors,
  hasRequiredFieldErrors,
  hasPricingErrors,
  hasSerialErrors,
  errors,
  onScrollToFirstError,
  itemCount
}: ValidationErrorSummaryProps) {
  if (itemCount === 0) {
    return (
      <Alert className="border-muted-foreground/20">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Items Added</AlertTitle>
        <AlertDescription>
          Add products to your acquisition to continue.
        </AlertDescription>
      </Alert>
    );
  }

  if (isValid) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Ready to Submit</AlertTitle>
        <AlertDescription className="text-green-700">
          All {itemCount} items are properly configured and ready for acquisition.
        </AlertDescription>
      </Alert>
    );
  }

  const errorCategories = [
    { 
      key: 'required', 
      label: 'Required Fields', 
      count: errors.filter(e => hasRequiredFieldErrors && (
        e.field.includes('brand') || 
        e.field.includes('model') || 
        e.field.includes('productId') || 
        e.field.includes('quantity') || 
        e.field.includes('unitCost')
      )).length,
      color: 'destructive'
    },
    { 
      key: 'pricing', 
      label: 'Pricing', 
      count: errors.filter(e => e.field.includes('price')).length,
      color: 'orange'
    },
    { 
      key: 'serial', 
      label: 'Serial Numbers', 
      count: errors.filter(e => e.field.includes('serial') || e.field.includes('unitEntries')).length,
      color: 'blue'
    }
  ].filter(category => category.count > 0);

  // Group errors by item
  const errorsByItem = errors.reduce((acc, error) => {
    const itemIndex = error.itemIndex ?? -1;
    if (!acc[itemIndex]) acc[itemIndex] = [];
    acc[itemIndex].push(error);
    return acc;
  }, {} as Record<number, ValidationError[]>);

  return (
    <Alert className="border-destructive/50 bg-destructive/5">
      <XCircle className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-destructive">
        {totalErrors} Validation Error{totalErrors !== 1 ? 's' : ''} Found
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {errorCategories.map(category => (
            <Badge 
              key={category.key} 
              variant={category.color as any}
              className="text-xs"
            >
              {category.label}: {category.count}
            </Badge>
          ))}
        </div>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {Object.entries(errorsByItem).map(([itemIndex, itemErrors]) => (
            <div key={itemIndex} className="text-sm">
              <div className="font-medium text-destructive">
                {itemIndex === '-1' ? 'General:' : `Item #${parseInt(itemIndex) + 1}:`}
              </div>
              <ul className="list-disc list-inside ml-2 space-y-1">
                {itemErrors.slice(0, 3).map((error, index) => (
                  <li key={index} className="text-destructive/80 text-xs">
                    {error.message}
                  </li>
                ))}
                {itemErrors.length > 3 && (
                  <li className="text-xs text-muted-foreground">
                    ... and {itemErrors.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-destructive/20">
          <span className="text-xs text-muted-foreground">
            Fix all errors before submitting
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onScrollToFirstError}
            className="text-xs"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Go to First Error
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}