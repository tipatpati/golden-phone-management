// ============================================
// DATA INTEGRITY PANEL COMPONENT
// ============================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Database,
  GitMerge
} from 'lucide-react';
import { useConsistencyReport, useConsistencyViolations, useConflictResolution } from '@/hooks/useDataConsistency';

export function DataIntegrityPanel() {
  const { report, isRunning, runCheck, hasViolations, status } = useConsistencyReport();
  const { violations, criticalCount, errorCount, warningCount } = useConsistencyViolations();
  const { conflicts, pendingConflicts, criticalConflicts, resolveConflict, isResolving } = useConflictResolution();

  const getStatusIcon = () => {
    if (isRunning) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (criticalConflicts.length > 0 || criticalCount > 0) return <XCircle className="h-5 w-5 text-destructive" />;
    if (conflicts.length > 0 || violations.length > 0) return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <CheckCircle className="h-5 w-5 text-success" />;
  };

  const getStatusText = () => {
    if (isRunning) return 'Checking...';
    if (criticalConflicts.length > 0 || criticalCount > 0) return 'Critical Issues';
    if (conflicts.length > 0 || violations.length > 0) return 'Issues Found';
    return 'Healthy';
  };

  const getStatusVariant = () => {
    if (criticalConflicts.length > 0 || criticalCount > 0) return 'destructive';
    if (conflicts.length > 0 || violations.length > 0) return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Integrity Monitor
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getStatusVariant() as any} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            <Button 
              onClick={runCheck} 
              disabled={isRunning}
              size="sm"
              variant="outline"
            >
              {isRunning ? 'Checking...' : 'Check Now'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{errorCount}</div>
            <div className="text-sm text-muted-foreground">Errors</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-warning">{warningCount}</div>
            <div className="text-sm text-muted-foreground">Warnings</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{conflicts.length}</div>
            <div className="text-sm text-muted-foreground">Conflicts</div>
          </div>
        </div>

        {/* Last Check Info */}
        {report && (
          <div className="text-sm text-muted-foreground">
            Last checked: {report.timestamp.toLocaleString()} | 
            Entities: {report.entitiesChecked.join(', ')}
          </div>
        )}

        {/* Data Consistency Issues */}
        {violations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <h4 className="font-medium">Data Consistency Issues</h4>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {violations.slice(0, 5).map((violation, index) => (
                <div key={`${violation.ruleId}-${index}`} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={violation.severity === 'critical' ? 'destructive' : 
                                      violation.severity === 'error' ? 'destructive' : 'default'}>
                          {violation.severity}
                        </Badge>
                        <span className="text-sm font-medium">{violation.ruleId}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{violation.message}</p>
                      {violation.suggestedFix && (
                        <p className="text-xs text-primary">Fix: {violation.suggestedFix}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {violations.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {violations.length - 5} more issues
                </p>
              )}
            </div>
          </div>
        )}

        {/* Data Conflicts */}
        {conflicts.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GitMerge className="h-4 w-4" />
                <h4 className="font-medium">Data Conflicts</h4>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conflicts.slice(0, 3).map((conflict) => (
                  <div key={conflict.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={conflict.severity === 'critical' ? 'destructive' : 'default'}>
                            {conflict.severity}
                          </Badge>
                          <span className="text-sm font-medium">{conflict.conflictType}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {conflict.entity}: {conflict.entityId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conflict.timestamp.toLocaleString()}
                        </p>
                      </div>
                      {!conflict.resolutionStrategy?.autoApply && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveConflict(conflict.id)}
                          disabled={isResolving}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {conflicts.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {conflicts.length - 3} more conflicts
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Healthy State */}
        {!hasViolations && conflicts.length === 0 && !isRunning && report && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All systems are healthy. No data integrity issues detected.
            </AlertDescription>
          </Alert>
        )}

        {/* No Check Run Yet */}
        {!report && !isRunning && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Run a data integrity check to monitor your system's health.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}