import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProductUnitsService } from '@/services/products/ProductUnitsService';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ValidationResult {
  valid: number;
  invalid: string[];
  missing: string[];
  total: number;
}

export function BarcodeValidationStatus() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const result = await ProductUnitsService.validateUnitBarcodes();
      const total = result.valid + result.invalid.length + result.missing.length;
      setValidationResult({ ...result, total });
    } catch (error) {
      console.error('Failed to validate barcodes:', error);
      toast.error('Failed to validate barcodes');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  if (!validationResult) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Barcode Validation</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={runValidation}
          disabled={isValidating}
        >
          {isValidating ? 'Validating...' : 'Run Validation'}
        </Button>
      </div>
    );
  }

  const validPercentage = validationResult.total > 0 
    ? Math.round((validationResult.valid / validationResult.total) * 100)
    : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Barcode Validation</span>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={runValidation}
          disabled={isValidating}
        >
          {isValidating ? 'Validating...' : 'Refresh'}
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <Badge variant="default" className="w-full justify-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            {validationResult.valid} Valid
          </Badge>
        </div>
        
        <div className="text-center">
          <Badge variant="destructive" className="w-full justify-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {validationResult.invalid.length} Invalid
          </Badge>
        </div>
        
        <div className="text-center">
          <Badge variant="secondary" className="w-full justify-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {validationResult.missing.length} Missing
          </Badge>
        </div>
      </div>
      
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          {validPercentage}% Valid ({validationResult.valid}/{validationResult.total})
        </span>
      </div>
      
      {(validationResult.invalid.length > 0 || validationResult.missing.length > 0) && (
        <div className="text-xs text-muted-foreground space-y-1">
          {validationResult.missing.length > 0 && (
            <div>
              <strong>Missing barcodes:</strong> {validationResult.missing.slice(0, 3).join(', ')}
              {validationResult.missing.length > 3 && '...'}
            </div>
          )}
          {validationResult.invalid.length > 0 && (
            <div>
              <strong>Invalid barcodes:</strong> {validationResult.invalid.slice(0, 2).join(', ')}
              {validationResult.invalid.length > 2 && '...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}