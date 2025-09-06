import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Database } from 'lucide-react';
import { ThermalLabelDataService } from '@/services/labels/ThermalLabelDataService';
import { ProductUnitsService } from '@/services/products/ProductUnitsService';
import { LabelDataValidator } from '@/services/labels/LabelDataValidator';

interface ValidationReport {
  totalProducts: number;
  totalUnits: number;
  unitsWithBarcodes: number;
  unitsMissingBarcodes: number;
  unitsWithIncompleteData: number;
  errors: string[];
  warnings: string[];
  missingBarcodeUnits: Array<{
    id: string;
    serial: string;
    product_id: string;
  }>;
}

export function LabelDataIntegrityTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runIntegrityCheck = async () => {
    setIsRunning(true);
    try {
      console.log('🔍 Starting label data integrity check...');
      
      // This would need to be implemented to check all products
      // For now, we'll show how this tool would work
      const mockReport: ValidationReport = {
        totalProducts: 0,
        totalUnits: 0,
        unitsWithBarcodes: 0,
        unitsMissingBarcodes: 0,
        unitsWithIncompleteData: 0,
        errors: [],
        warnings: ['This tool needs to be connected to product data'],
        missingBarcodeUnits: []
      };

      setReport(mockReport);
      setLastRun(new Date());
      
    } catch (error) {
      console.error('Label integrity check failed:', error);
      setReport({
        totalProducts: 0,
        totalUnits: 0,
        unitsWithBarcodes: 0,
        unitsMissingBarcodes: 0,
        unitsWithIncompleteData: 0,
        errors: [`Check failed: ${error}`],
        warnings: [],
        missingBarcodeUnits: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  const triggerBarcodeBackfill = async () => {
    try {
      console.log('🔧 Triggering barcode backfill...');
      const result = await ProductUnitsService.backfillMissingBarcodes();
      console.log('✅ Backfill completed:', result);
      
      // Re-run integrity check
      await runIntegrityCheck();
    } catch (error) {
      console.error('Barcode backfill failed:', error);
    }
  };

  const getStatusColor = () => {
    if (!report) return 'secondary';
    if (report.errors.length > 0) return 'destructive';
    if (report.warnings.length > 0 || report.unitsMissingBarcodes > 0) return 'outline';
    return 'default';
  };

  const getStatusIcon = () => {
    if (!report) return <Database className="h-4 w-4" />;
    if (report.errors.length > 0) return <AlertCircle className="h-4 w-4" />;
    if (report.warnings.length > 0 || report.unitsMissingBarcodes > 0) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Label Data Integrity Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Validate thermal label data integrity across all products and units
            </p>
            {lastRun && (
              <p className="text-xs text-muted-foreground">
                Last run: {lastRun.toLocaleString()}
              </p>
            )}
          </div>
          <Button
            onClick={runIntegrityCheck}
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Checking...' : 'Run Check'}
          </Button>
        </div>

        {report && (
          <div className="space-y-4">
            <Alert>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <AlertDescription>
                  <Badge variant={getStatusColor()}>
                    {report.errors.length > 0 ? 'Issues Found' : 
                     report.warnings.length > 0 || report.unitsMissingBarcodes > 0 ? 'Warnings' : 
                     'All Good'}
                  </Badge>
                </AlertDescription>
              </div>
            </Alert>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{report.totalUnits}</div>
                <div className="text-xs text-muted-foreground">Total Units</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{report.unitsWithBarcodes}</div>
                <div className="text-xs text-muted-foreground">With Barcodes</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{report.unitsMissingBarcodes}</div>
                <div className="text-xs text-muted-foreground">Missing Barcodes</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{report.unitsWithIncompleteData}</div>
                <div className="text-xs text-muted-foreground">Incomplete Data</div>
              </div>
            </div>

            {report.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Critical Issues:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {report.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {report.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Warnings:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {report.warnings.map((warning, index) => (
                      <li key={index} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {report.unitsMissingBarcodes > 0 && (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <div className="font-medium">Missing Barcodes Detected</div>
                  <div className="text-sm text-muted-foreground">
                    {report.unitsMissingBarcodes} units need barcodes for thermal label generation
                  </div>
                </div>
                <Button
                  onClick={triggerBarcodeBackfill}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fix Now
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}