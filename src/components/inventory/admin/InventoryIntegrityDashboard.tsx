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
    return report.stockMismatches.length + report.orphanedUnits.length + report.invalidSerialSales.length + report.inconsistentStatuses.length;
  };
  const getStatusColor = () => {
    const issues = getTotalIssues();
    if (issues === 0) return 'success';
    if (issues < 5) return 'warning';
    return 'destructive';
  };
  return;
};