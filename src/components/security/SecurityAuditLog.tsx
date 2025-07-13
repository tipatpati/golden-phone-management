import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLogEntry {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export const SecurityAuditLog: React.FC = () => {
  const { userRole } = useAuth();
  
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['security-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: userRole === 'admin'
  });

  // Only admins can view security logs
  if (userRole !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Only administrators can view security audit logs.</p>
        </CardContent>
      </Card>
    );
  }

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'role_change':
        return 'default';
      case 'failed_auth_attempt':
        return 'destructive';
      case 'unauthorized_access_attempt':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading audit logs...</p>
        ) : !auditLogs?.length ? (
          <p>No security events recorded.</p>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="border rounded p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={getEventBadgeVariant(log.event_type)}>
                    {log.event_type.replace('_', ' ').toUpperCase()}
                  </Badge>
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
  );
};