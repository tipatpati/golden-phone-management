import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Bell, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityAlert {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  severity: 'high' | 'medium' | 'low';
}

export function SecurityAlerts() {
  const { userRole } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userRole !== 'admin') return;

    const fetchRecentAlerts = async () => {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .in('event_type', [
          'role_change',
          'failed_auth_attempt',
          'unauthorized_access_attempt',
          'suspicious_activity'
        ])
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching security alerts:', error);
        return;
      }

      const alertsWithSeverity = data.map(alert => ({
        ...alert,
        severity: getSeverity(alert.event_type) as 'high' | 'medium' | 'low'
      }));

      setAlerts(alertsWithSeverity);
    };

    fetchRecentAlerts();

    // Set up real-time subscription for new security events
    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_audit_log'
        },
        (payload) => {
          const newAlert = {
            ...payload.new,
            severity: getSeverity(payload.new.event_type)
          } as SecurityAlert;
          
          setAlerts(prev => [newAlert, ...prev].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userRole]);

  const getSeverity = (eventType: string): string => {
    switch (eventType) {
      case 'role_change':
        return 'high';
      case 'failed_auth_attempt':
      case 'unauthorized_access_attempt':
        return 'medium';
      case 'suspicious_activity':
        return 'high';
      default:
        return 'low';
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (userRole !== 'admin' || visibleAlerts.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Bell className="h-5 w-5" />
          Security Alerts (Last 24h)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleAlerts.slice(0, 5).map(alert => (
          <Alert key={alert.id} className="relative">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={alert.severity === 'high' ? 'destructive' : 
                          alert.severity === 'medium' ? 'default' : 'secondary'}
                >
                  {alert.severity.toUpperCase()}
                </Badge>
                <span className="font-medium">
                  {alert.event_type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        ))}
        {visibleAlerts.length > 5 && (
          <p className="text-sm text-muted-foreground">
            {visibleAlerts.length - 5} more alerts in audit log...
          </p>
        )}
      </CardContent>
    </Card>
  );
}