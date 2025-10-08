import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/enhanced-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/enhanced-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { useCurrentUserRole } from '@/hooks/useRoleManagement';
import { AdminOnly } from '@/components/common/RoleGuard';
import { Filter, Download, AlertTriangle } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const SecurityAuditLog: React.FC = () => {
  const { data: currentRole } = useCurrentUserRole();
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  
  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['security-audit-log', eventFilter, severityFilter],
    queryFn: async () => {
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventFilter !== 'all') {
        query = query.eq('event_type', eventFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let filteredData = data as AuditLogEntry[];
      
      // Apply severity filtering client-side since it's not a database field
      if (severityFilter !== 'all') {
        filteredData = filteredData.filter(log => {
          const severity = getEventSeverity(log.event_type);
          return severity === severityFilter;
        });
      }
      
      return filteredData;
    },
    enabled: currentRole && ['admin', 'super_admin'].includes(currentRole),
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  const getEventSeverity = (eventType: string): string => {
    switch (eventType) {
      case 'role_change':
      case 'role_change_attempted':
      case 'role_change_completed':
        return 'high';
      case 'failed_auth_attempt':
      case 'unauthorized_access_attempt':
      case 'suspicious_activity':
        return 'medium';
      case 'role_change_failed':
        return 'high';
      default:
        return 'low';
    }
  };

  const getEventBadgeVariant = (eventType: string) => {
    const severity = getEventSeverity(eventType);
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const exportAuditLog = () => {
    if (!auditLogs) return;
    
    const csvContent = [
      ['Timestamp', 'Event Type', 'Severity', 'Event Data', 'IP Address'].join(','),
      ...auditLogs.map(log => [
        new Date(log.created_at).toISOString(),
        log.event_type,
        getEventSeverity(log.event_type),
        JSON.stringify(log.event_data || {}),
        log.ip_address || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const criticalEvents = auditLogs?.filter(log => 
    getEventSeverity(log.event_type) === 'high'
  ).length || 0;

  return (
    <AdminOnly fallback={
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Only administrators can view security audit logs.</p>
        </CardContent>
      </Card>
    }>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Security Audit Log</span>
            <div className="flex items-center gap-2">
              {criticalEvents > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalEvents} Critical
                </Badge>
              )}
              <Button onClick={exportAuditLog} size="sm" variant="outlined">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="role_change">Role Changes</SelectItem>
                  <SelectItem value="failed_auth_attempt">Failed Auth</SelectItem>
                  <SelectItem value="unauthorized_access_attempt">Unauthorized Access</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <p>Loading audit logs...</p>
          ) : !auditLogs?.length ? (
            <p>No security events recorded.</p>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getEventBadgeVariant(log.event_type)}>
                        {log.event_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getEventSeverity(log.event_type).toUpperCase()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {log.event_data && (
                    <div className="text-sm">
                      <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(log.event_data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.ip_address && (
                    <div className="text-xs text-muted-foreground">
                      IP: {log.ip_address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminOnly>
  );
};