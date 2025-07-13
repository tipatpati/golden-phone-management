import { supabase } from "@/integrations/supabase/client";

export interface SecurityEvent {
  event_type: string;
  event_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export const logSecurityEvent = async (event: SecurityEvent) => {
  try {
    const { error } = await supabase
      .from('security_audit_log')
      .insert([{
        event_type: event.event_type,
        event_data: event.event_data,
        ip_address: event.ip_address,
        user_agent: event.user_agent || navigator.userAgent
      }]);

    if (error) {
      console.error('Failed to log security event:', error);
    }
  } catch (error) {
    console.error('Error logging security event:', error);
  }
};

export const logFailedAuthAttempt = async (email: string, reason: string) => {
  await logSecurityEvent({
    event_type: 'failed_auth_attempt',
    event_data: { email, reason }
  });
};

export const logUnauthorizedAccess = async (resource: string, attempted_action: string) => {
  await logSecurityEvent({
    event_type: 'unauthorized_access_attempt',
    event_data: { resource, attempted_action }
  });
};

export const logDataAccess = async (table: string, action: 'read' | 'write' | 'delete', recordCount?: number) => {
  await logSecurityEvent({
    event_type: 'data_access',
    event_data: { table, action, recordCount }
  });
};

export const logSessionActivity = async (activity: 'login' | 'logout' | 'timeout' | 'concurrent_session') => {
  await logSecurityEvent({
    event_type: 'session_activity',
    event_data: { activity, timestamp: new Date().toISOString() }
  });
};

export const logPermissionChange = async (targetUserId: string, oldRole: string, newRole: string) => {
  await logSecurityEvent({
    event_type: 'permission_change',
    event_data: { targetUserId, oldRole, newRole }
  });
};

export const logSuspiciousActivity = async (activity: string, metadata?: Record<string, any>) => {
  await logSecurityEvent({
    event_type: 'suspicious_activity',
    event_data: { activity, metadata, severity: 'high' }
  });
};