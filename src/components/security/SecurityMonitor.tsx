import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
  user_id?: string;
}

interface SecurityStats {
  totalEvents: number;
  suspiciousEvents: number;
  failedLogins: number;
  activeThreats: number;
}

export function SecurityMonitor() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    suspiciousEvents: 0,
    failedLogins: 0,
    activeThreats: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Fetch recent security events
      const { data: eventsData } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsData) {
        setEvents(eventsData);
        
        // Calculate stats
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentEvents = eventsData.filter(
          event => new Date(event.created_at) > last24Hours
        );
        
        const suspiciousEvents = recentEvents.filter(
          event => event.event_type === 'suspicious_activity'
        );
        
        const failedLogins = recentEvents.filter(
          event => event.event_type === 'failed_auth_attempt'
        );

        const activeThreats = suspiciousEvents.filter(
          event => {
            if (typeof event.event_data === 'object' && event.event_data !== null) {
              return (event.event_data as any).severity === 'high';
            }
            return false;
          }
        );

        setStats({
          totalEvents: recentEvents.length,
          suspiciousEvents: suspiciousEvents.length,
          failedLogins: failedLogins.length,
          activeThreats: activeThreats.length
        });
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'suspicious_activity':
        return 'destructive';
      case 'failed_auth_attempt':
        return 'secondary';
      case 'session_activity':
        return 'default';
      case 'permission_change':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4" />;
      case 'failed_auth_attempt':
        return <XCircle className="h-4 w-4" />;
      case 'session_activity':
        return <CheckCircle className="h-4 w-4" />;
      case 'permission_change':
        return <Eye className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const formatEventData = (eventData: any, eventType: string) => {
    if (!eventData) return 'No additional data';
    
    switch (eventType) {
      case 'failed_auth_attempt':
        return `Email: ${eventData.email || 'Unknown'}, Reason: ${eventData.reason || 'Unknown'}`;
      case 'suspicious_activity':
        return `Activity: ${eventData.activity || 'Unknown'}, Severity: ${eventData.severity || 'Medium'}`;
      case 'session_activity':
        return `Activity: ${eventData.activity || 'Unknown'}`;
      case 'permission_change':
        return `Target: ${eventData.targetUserId || 'Unknown'}, Old Role: ${eventData.oldRole || 'Unknown'}, New Role: ${eventData.newRole || 'Unknown'}`;
      default:
        return JSON.stringify(eventData).slice(0, 100) + '...';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events (24h)</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspicious Events</p>
                <p className="text-2xl font-bold text-orange-600">{stats.suspiciousEvents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Logins</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedLogins}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold text-red-700">{stats.activeThreats}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Threats Alert */}
      {stats.activeThreats > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stats.activeThreats} active security threat(s) detected. Please review the security events below.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No security events recorded yet.
              </p>
            ) : (
              events.slice(0, 20).map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getEventBadgeVariant(event.event_type)}>
                          {event.event_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatEventData(event.event_data, event.event_type)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}