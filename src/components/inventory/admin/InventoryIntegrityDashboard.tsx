import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { InventoryIntegrityService, type IntegrityReport } from '@/services/inventory/InventoryIntegrityService';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export const InventoryIntegrityDashboard = () => {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const runIntegrityCheck = async () => {
    setIsRunning(true);
    try {
      const newReport = await InventoryIntegrityService.runIntegrityCheck();
      setReport(newReport);
      toast.success('Integrity check completed');
    } catch (error) {
      console.error('Integrity check failed:', error);
      toast.error('Failed to run integrity check');
    } finally {
      setIsRunning(false);
    }
  };

  const autoRepair = async () => {
    setIsRepairing(true);
    try {
      const result = await InventoryIntegrityService.autoRepairIntegrity();
      
      if (result.repaired > 0) {
        toast.success(`Repaired ${result.repaired} issues`);
        // Re-run check to update report
        await runIntegrityCheck();
      } else {
        toast.info('No issues found to repair');
      }
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => toast.error(error));
      }
    } catch (error) {
      console.error('Auto-repair failed:', error);
      toast.error('Auto-repair failed');
    } finally {
      setIsRepairing(false);
    }
  };

  const getTotalIssues = () => {
    if (!report) return 0;
    return (
      report.stockMismatches.length +
      report.orphanedUnits.length +
      report.invalidSerialSales.length +
      report.inconsistentStatuses.length
    );
  };

  const getStatusColor = () => {
    const issues = getTotalIssues();
    if (issues === 0) return 'success';
    if (issues < 5) return 'warning';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Inventory Integrity Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor and repair data consistency between Sales and Inventory modules
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={runIntegrityCheck}
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Shield className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Check'}
          </Button>
          
          {report && getTotalIssues() > 0 && (
            <Button
              onClick={autoRepair}
              disabled={isRepairing}
              variant="default"
            >
              {isRepairing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wrench className="h-4 w-4 mr-2" />
              )}
              {isRepairing ? 'Repairing...' : 'Auto Repair'}
            </Button>
          )}
        </div>
      </div>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getTotalIssues() === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
              Integrity Status
            </CardTitle>
            <CardDescription>
              Last checked: {new Date().toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {report.stockMismatches.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Stock Mismatches
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {report.inconsistentStatuses.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status Issues
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {report.invalidSerialSales.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Serial Issues
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    {report.orphanedUnits.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Orphaned Units
                  </div>
                </CardContent>
              </Card>
            </div>

            {report.suggestions.length > 0 && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    {report.suggestions.map((suggestion, index) => (
                      <div key={index}>{suggestion}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Stock Mismatches */}
            {report.stockMismatches.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Stock Mismatches</h3>
                <div className="space-y-2">
                  {report.stockMismatches.map((mismatch, index) => (
                    <Card key={index} className="border-red-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{mismatch.brand} {mismatch.model}</div>
                            <div className="text-sm text-muted-foreground">
                              Recorded: {mismatch.recordedStock} | Actual: {mismatch.actualAvailableUnits}
                            </div>
                          </div>
                          <Badge variant={mismatch.difference > 0 ? 'destructive' : 'secondary'}>
                            {mismatch.difference > 0 ? '+' : ''}{mismatch.difference}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            {/* Status Inconsistencies */}
            {report.inconsistentStatuses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-orange-600">Status Inconsistencies</h3>
                <div className="space-y-2">
                  {report.inconsistentStatuses.map((status, index) => (
                    <Card key={index} className="border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Serial: {status.serialNumber}</div>
                            <div className="text-sm text-muted-foreground">{status.issue}</div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">{status.unitStatus}</Badge>
                            {status.saleStatus && (
                              <Badge variant="secondary">{status.saleStatus}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            {/* Invalid Serial Sales */}
            {report.invalidSerialSales.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-600">Invalid Serial Sales</h3>
                <div className="space-y-2">
                  {report.invalidSerialSales.map((sale, index) => (
                    <Card key={index} className="border-yellow-200">
                      <CardContent className="p-4">
                        <div>
                          <div className="font-medium">Sale: {sale.saleNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            Serial: {sale.serialNumber} | {sale.issue}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            {/* Orphaned Units */}
            {report.orphanedUnits.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-600">Orphaned Units</h3>
                <div className="space-y-2">
                  {report.orphanedUnits.map((unit, index) => (
                    <Card key={index} className="border-purple-200">
                      <CardContent className="p-4">
                        <div>
                          <div className="font-medium">Serial: {unit.serialNumber}</div>
                          <div className="text-sm text-muted-foreground">{unit.reason}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!report && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Run Integrity Check</h3>
            <p className="text-muted-foreground mb-4">
              Click "Run Check" to analyze data consistency between Sales and Inventory modules
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};