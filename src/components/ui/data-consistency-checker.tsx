import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { useConsistencyReport, useConsistencyViolations } from '@/hooks/useDataConsistency';

export function DataConsistencyChecker() {
  const { report, isRunning, runCheck, hasViolations, status } = useConsistencyReport();
  const { violations, criticalCount, errorCount, warningCount } = useConsistencyViolations();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Data Consistency Check
          <Button 
            onClick={runCheck} 
            disabled={isRunning}
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Checking...' : 'Run Check'}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {report && (
          <p className="text-sm text-muted-foreground mb-4">
            Last checked: {report.timestamp.toLocaleString()}
          </p>
        )}

        {!hasViolations && !isRunning && report && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No data consistency issues found. Your data appears to be in good shape!
            </AlertDescription>
          </Alert>
        )}

        {hasViolations && (
          <div className="space-y-3">
            <div className="flex gap-2 mb-4">
              <Badge variant="outline">
                {violations.length} issue{violations.length !== 1 ? 's' : ''} found
              </Badge>
              <Badge variant="destructive">
                {criticalCount} critical
              </Badge>
              <Badge variant="destructive">
                {errorCount} errors
              </Badge>
              <Badge variant="default">
                {warningCount} warnings
              </Badge>
            </div>

            {violations.map((violation, index) => (
              <div key={`${violation.ruleId}-${violation.entityId}-${index}`} className="flex items-start justify-between p-3 border rounded-lg">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(violation.severity)}
                  <div>
                    <p className="font-medium">{violation.message}</p>
                    <p className="text-sm text-muted-foreground">
                      Rule: {violation.ruleId} | Entity: {violation.entity}
                    </p>
                    {violation.suggestedFix && (
                      <p className="text-sm text-blue-600 mt-1">
                        Suggested fix: {violation.suggestedFix}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityColor(violation.severity) as any}>
                    {violation.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {isRunning && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Checking data consistency...</span>
          </div>
        )}

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