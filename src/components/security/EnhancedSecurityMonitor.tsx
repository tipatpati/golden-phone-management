import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logSecurityEvent } from '@/utils/securityAudit';

interface SecurityThreat {
  id: string;
  type: 'xss_attempt' | 'sql_injection' | 'brute_force' | 'session_hijack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
}

export function EnhancedSecurityMonitor() {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    if (!isMonitoring) return;

    // Monitor for suspicious activities
    const monitoringInterval = setInterval(async () => {
      try {
        // Check for recent security events
        const { data: recentEvents, error } = await supabase
          .from('security_audit_log')
          .select('*')
          .in('event_type', ['xss_attempt', 'sql_injection_attempt', 'suspicious_activity'])
          .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Security monitoring error:', error);
          return;
        }

        if (recentEvents && recentEvents.length > 0) {
          const newThreats: SecurityThreat[] = recentEvents.map(event => ({
            id: event.id,
            type: event.event_type as SecurityThreat['type'],
            severity: (event.event_data as any)?.severity || 'medium',
            description: `${event.event_type.replace('_', ' ').toUpperCase()} detected`,
            timestamp: event.created_at
          }));

          setThreats(prev => [...newThreats, ...prev].slice(0, 10)); // Keep only last 10

          // Show critical alerts
          newThreats.forEach(threat => {
            if (threat.severity === 'critical' || threat.severity === 'high') {
              toast.error('Security Alert', {
                description: `${threat.description} - Session being monitored`,
                duration: 10000
              });
            }
          });
        }
      } catch (error) {
        console.error('Security monitoring failed:', error);
      }
    }, 30000); // Check every 30 seconds

    // Monitor page visibility for security purposes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent({
          event_type: 'page_hidden',
          event_data: { 
            timestamp: new Date().toISOString(),
            duration: Date.now() 
          }
        });
      } else {
        logSecurityEvent({
          event_type: 'page_visible',
          event_data: { 
            timestamp: new Date().toISOString(),
            duration: Date.now() 
          }
        });
      }
    };

    // Monitor for potential session hijacking
    const monitorSession = () => {
      const userAgent = navigator.userAgent;
      const screenResolution = `${screen.width}x${screen.height}`;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const sessionFingerprint = btoa(`${userAgent}|${screenResolution}|${timezone}`);
      const storedFingerprint = localStorage.getItem('session_fingerprint');
      
      if (storedFingerprint && storedFingerprint !== sessionFingerprint) {
        logSecurityEvent({
          event_type: 'session_fingerprint_mismatch',
          event_data: {
            stored: storedFingerprint,
            current: sessionFingerprint,
            severity: 'high'
          }
        });
        
        toast.warning('Security Alert', {
          description: 'Session anomaly detected. Please re-authenticate.',
          duration: 15000
        });
      } else if (!storedFingerprint) {
        localStorage.setItem('session_fingerprint', sessionFingerprint);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    monitorSession();

    return () => {
      clearInterval(monitoringInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMonitoring]);

  // This component runs in the background, no UI needed
  return null;
}