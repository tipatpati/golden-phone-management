import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProductUnitsService } from '@/services/inventory/ProductUnitsService';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { BarcodeValidationStatus } from './BarcodeValidationStatus';

interface BarcodeBackfillResult {
  updated: number;
  errors: number;
}

export function BarcodeBackfillTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BarcodeBackfillResult | null>(null);

  const handleBackfill = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      console.log('🔄 Starting barcode backfill...');
      const backfillResult = await ProductUnitsService.backfillMissingBarcodes();
      
      setResult(backfillResult);
      
      if (backfillResult.updated > 0) {
        toast.success(`Successfully updated ${backfillResult.updated} units with professional barcodes`);
      } else {
        toast.success('All units already have barcodes - no updates needed');
      }
      
      if (backfillResult.errors > 0) {
        toast.error(`${backfillResult.errors} units failed to update. Check console for details.`);
      }
      
    } catch (error) {
      console.error('Failed to run barcode backfill:', error);
      toast.error('Failed to run barcode backfill. Check console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Validation Status */}
      <div className="p-4 border border-border rounded-lg">
        <BarcodeValidationStatus />
      </div>
      
      {/* Backfill Tool */}
      <div className="p-4 border border-border rounded-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Barcode Backfill Tool</h3>
              <p className="text-sm text-muted-foreground">
                Generate professional CODE128 barcodes for units missing them
              </p>
            </div>
            
            <Button
              onClick={handleBackfill}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running...' : 'Run Backfill'}
            </Button>
          </div>
          
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Updated {result.updated} units with new barcodes
                </span>
              </div>
              
              {result.errors > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {result.errors} units failed to update
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}