/**
 * PHASE 5: Data Integrity Validation Dashboard
 * Comprehensive monitoring and diagnostics for the unified barcode system
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/updated-card";
import { Button } from "@/components/ui/updated-button";
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
  Database
} from "lucide-react";
import { toast } from "sonner";
import { UnifiedBarcodeCoordinator } from "@/services/shared/UnifiedBarcodeCoordinator";

interface IntegrityStats {
  isHealthy: boolean;
  missingBarcodes: string[];
  orphanedBarcodes: string[];
  duplicateBarcodes: string[];
  lastSyncTime: Date;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, any>;
}

export function UnifiedDataIntegrityDashboard() {
  const [integrityStats, setIntegrityStats] = useState<IntegrityStats | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
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
        UnifiedBarcodeCoordinator.validateDataIntegrity(),
        UnifiedBarcodeCoordinator.getHealthStatus()
      ]);
      
      setIntegrityStats(integrity);
      setHealthStatus(health);
    } catch (error) {
      console.error('Failed to validate data integrity:', error);
      toast.error('Failed to validate system integrity');
    } finally {
      setIsValidating(false);
    }
  };

  const fixIntegrityIssues = async () => {
    setIsFixing(true);
    try {
      const results = await UnifiedBarcodeCoordinator.fixDataIntegrityIssues();
      setFixResults(results);
      
      // Re-validate after fixes
      await runInitialValidation();
      
      toast.success(`Fixed ${results.fixedMissingBarcodes} missing barcodes and ${results.removedOrphanedBarcodes} orphaned entries`);
    } catch (error) {
      console.error('Failed to fix integrity issues:', error);
      toast.error('Failed to fix integrity issues');
    } finally {
      setIsFixing(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!integrityStats || !healthStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading system diagnostics...</span>
      </div>
    );
  }

  const totalIssues = integrityStats.missingBarcodes.length + 
                     integrityStats.orphanedBarcodes.length + 
                     integrityStats.duplicateBarcodes.length;

  const healthPercentage = integrityStats.isHealthy ? 100 : 
    Math.max(0, 100 - (totalIssues * 10));

  return (
    <div className="space-y-6">
      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Unified Barcode System Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring of barcode coordination between supplier and inventory modules
              </CardDescription>
            </div>
            <Button
              onClick={runInitialValidation}
              disabled={isValidating}
              variant="outlined"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
          <TabsTrigger value="services">Services</TabsTrigger>
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
                  Units without barcodes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Orphaned Barcodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {integrityStats.orphanedBarcodes.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Barcodes without units
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Duplicate Barcodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {integrityStats.duplicateBarcodes.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Conflicting barcodes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Service Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  healthStatus.status === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : healthStatus.status === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {healthStatus.status}
                </div>
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
                    <span className="font-medium">Fixed Missing:</span> {fixResults.fixedMissingBarcodes}
                  </div>
                  <div>
                    <span className="font-medium">Removed Orphaned:</span> {fixResults.removedOrphanedBarcodes}
                  </div>
                  <div>
                    <span className="font-medium">Resolved Duplicates:</span> {fixResults.resolvedDuplicates}
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
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {integrityStats.missingBarcodes.map((serial, index) => (
                    <Badge key={index} variant="destructive" className="mr-2 mb-1">
                      {serial}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {integrityStats.orphanedBarcodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Orphaned Barcodes ({integrityStats.orphanedBarcodes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {integrityStats.orphanedBarcodes.map((barcode, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-1">
                      {barcode}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {integrityStats.duplicateBarcodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Duplicate Barcodes ({integrityStats.duplicateBarcodes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {integrityStats.duplicateBarcodes.map((barcode, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-1">
                      {barcode}
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
                  <h3 className="text-lg font-semibold text-green-600">Perfect Data Integrity</h3>
                  <p className="text-muted-foreground">
                    All barcodes are properly synchronized between supplier and inventory modules.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Barcode Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(healthStatus.details.barcodeService)}
                  <span className="capitalize">{healthStatus.details.barcodeService}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Generation and validation service
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Print Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(healthStatus.details.printService)}
                  <span className="capitalize">{healthStatus.details.printService}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Thermal label printing service
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
                Real-time synchronization between supplier and inventory modules
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
                  <div className="text-sm font-medium">Data Integrity</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(healthStatus.details.dataIntegrity ? 'healthy' : 'unhealthy')}
                    <span>{healthStatus.details.dataIntegrity ? 'Synchronized' : 'Issues Found'}</span>
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