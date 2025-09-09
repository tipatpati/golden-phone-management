/**
 * PHASE 5: Product & Unit Data Integrity Monitoring Dashboard
 * Comprehensive monitoring and diagnostics for the unified product system
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Wrench, 
  BarChart3, 
  Activity,
  Package,
  Layers
} from "lucide-react";
import { toast } from "sonner";
import { UnifiedProductCoordinator } from "@/services/shared/UnifiedProductCoordinator";

interface ProductIntegrityStats {
  isHealthy: boolean;
  missingBarcodes: Array<{ productId: string; issueType: string; description: string }>;
  orphanedUnits: string[];
  duplicateSerials: string[];
  inconsistentFlags: string[];
  lastSyncTime: Date;
}

interface ProductHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
}

export function UnifiedProductIntegrityDashboard() {
  const [integrityStats, setIntegrityStats] = useState<ProductIntegrityStats | null>(null);
  const [healthStatus, setHealthStatus] = useState<ProductHealthStatus | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [fixResults, setFixResults] = useState<any>(null);

  useEffect(() => {
    runInitialValidation();
  }, []);

  const runInitialValidation = async () => {
    setIsValidating(true);
    try {
      const [integrity, health] = await Promise.all([
        UnifiedProductCoordinator.validateProductIntegrity(),
        UnifiedProductCoordinator.getHealthStatus()
      ]);
      
      setIntegrityStats(integrity);
      setHealthStatus(health);
    } catch (error) {
      console.error('Failed to validate product integrity:', error);
      toast.error('Failed to validate system integrity');
    } finally {
      setIsValidating(false);
    }
  };

  const fixIntegrityIssues = async () => {
    setIsFixing(true);
    try {
      const results = await UnifiedProductCoordinator.fixProductIntegrityIssues();
      setFixResults(results);
      
      // Re-validate after fixes
      await runInitialValidation();
      
      toast.success(`Fixed ${results.fixedBarcodes} barcodes, ${results.fixedFlags} flags, ${results.fixedUnits} units`);
    } catch (error) {
      console.error('Failed to fix integrity issues:', error);
      toast.error('Failed to fix integrity issues');
    } finally {
      setIsFixing(false);
    }
  };

  const requestSync = async () => {
    try {
      await UnifiedProductCoordinator.requestSync();
      toast.success('Synchronization requested');
      // Re-validate after sync
      setTimeout(runInitialValidation, 2000);
    } catch (error) {
      console.error('Failed to request sync:', error);
      toast.error('Failed to request synchronization');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  if (!integrityStats || !healthStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading product system diagnostics...</span>
      </div>
    );
  }

  const totalIssues = integrityStats.missingBarcodes.length + 
                     integrityStats.orphanedUnits.length + 
                     integrityStats.duplicateSerials.length +
                     integrityStats.inconsistentFlags.length;

  const healthPercentage = integrityStats.isHealthy ? 100 : 
    Math.max(0, 100 - (totalIssues * 5));

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Unified Product System Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring of product and unit coordination between supplier and inventory modules
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={runInitialValidation}
                disabled={isValidating}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={requestSync}
                variant="outline"
                size="sm"
              >
                <Layers className="h-4 w-4 mr-2" />
                Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getStatusIcon(healthStatus.status)}
              </div>
              <div className="text-2xl font-bold capitalize">{healthStatus.status}</div>
              <div className="text-sm text-muted-foreground">Overall Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{healthPercentage}%</div>
              <Progress value={healthPercentage} className="mt-2 mb-1" />
              <div className="text-sm text-muted-foreground">System Health</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{totalIssues}</div>
              <div className="text-sm text-muted-foreground">
                {totalIssues === 0 ? 'No Issues Found' : 'Issues Detected'}
              </div>
              {totalIssues > 0 && (
                <Button
                  onClick={fixIntegrityIssues}
                  disabled={isFixing}
                  size="sm"
                  className="mt-2"
                >
                  <Wrench className={`h-3 w-3 mr-1 ${isFixing ? 'animate-pulse' : ''}`} />
                  Auto-Fix
                </Button>
              )}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            Last updated: {integrityStats.lastSyncTime.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrity">Data Integrity</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Missing Barcodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {integrityStats.missingBarcodes.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Products/units without barcodes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Orphaned Units</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {integrityStats.orphanedUnits.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Units without valid products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Duplicate Serials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {integrityStats.duplicateSerials.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Conflicting serial numbers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Flag Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {integrityStats.inconsistentFlags.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inconsistent has_serial flags
                </p>
              </CardContent>
            </Card>
          </div>

          {fixResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last Auto-Fix Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Fixed Barcodes:</span> {fixResults.fixedBarcodes}
                  </div>
                  <div>
                    <span className="font-medium">Fixed Flags:</span> {fixResults.fixedFlags}
                  </div>
                  <div>
                    <span className="font-medium">Fixed Units:</span> {fixResults.fixedUnits}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          {integrityStats.missingBarcodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Missing Barcodes ({integrityStats.missingBarcodes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {integrityStats.missingBarcodes.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <span className="text-sm">{issue.description}</span>
                      <Badge variant="destructive" className="text-xs">
                        {issue.issueType}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {integrityStats.duplicateSerials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Duplicate Serial Numbers ({integrityStats.duplicateSerials.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {integrityStats.duplicateSerials.map((issue, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-1">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {totalIssues === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-600">Perfect Product Integrity</h3>
                  <p className="text-muted-foreground">
                    All products and units are properly synchronized between supplier and inventory modules.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Auto-barcode generation:</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between">
                    <span>Cross-module sync:</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between">
                    <span>Integrity validation:</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Unit Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Auto-barcode generation:</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between">
                    <span>Product relationship sync:</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between">
                    <span>Serial number validation:</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coordination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cross-Module Coordination</CardTitle>
              <CardDescription>
                Real-time synchronization between supplier and inventory modules for products and units
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Event Listeners</div>
                  <div className="text-2xl font-bold">{healthStatus.details.eventListeners}</div>
                  <div className="text-xs text-muted-foreground">Active coordinators</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Product Integrity</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthStatus.details.productIntegrity ? 'healthy' : 'unhealthy')}
                    <span>{healthStatus.details.productIntegrity ? 'Synchronized' : 'Issues Found'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}