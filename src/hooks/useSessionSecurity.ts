import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logSessionActivity, logSuspiciousActivity } from '@/utils/securityAudit';
import { useToast } from '@/hooks/use-toast';

interface SessionSecurityConfig {
  timeoutMinutes?: number;
  maxIdleMinutes?: number;
  detectConcurrentSessions?: boolean;
}

export function useSessionSecurity(config: SessionSecurityConfig = {}) {
  const {
    timeoutMinutes = 120, // 2 hours default
    maxIdleMinutes = 30,
    detectConcurrentSessions = true
  } = config;

  const { toast } = useToast();
  const lastActivityRef = useRef(Date.now());
  const sessionCheckRef = useRef<NodeJS.Timeout>();
  const [isSessionValid, setIsSessionValid] = useState(true);

  // Update last activity time
  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // Check for session timeout
  const checkSessionTimeout = async () => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    const maxIdleMs = maxIdleMinutes * 60 * 1000;

    // Check for idle timeout only
    if (timeSinceActivity > maxIdleMs) {
      await handleSessionTimeout('idle');
      return;
    }

    // Get current session to check if it's still valid
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // No session means user is already logged out
      setIsSessionValid(false);
      return;
    }

    // Check if session token has actually expired according to Supabase
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at).getTime();
      if (now >= expiresAt) {
        await handleSessionTimeout('expired');
        return;
      }
    }

    // Detect concurrent sessions if enabled (but don't auto-logout for this)
    if (detectConcurrentSessions && session) {
      await checkConcurrentSessions(session.user.id);
    }
  };

  const handleSessionTimeout = async (reason: 'idle' | 'expired') => {
    setIsSessionValid(false);
    await logSessionActivity('timeout');
    
    toast({
      title: "Session Expired",
      description: reason === 'idle' 
        ? "Your session has expired due to inactivity." 
        : "Your session has expired. Please log in again.",
      variant: "destructive"
    });

    await supabase.auth.signOut();
  };

  const checkConcurrentSessions = async (userId: string) => {
    try {
      // This would require server-side session tracking
      // For now, we'll log if we detect unusual patterns
      const { data: recentLogins } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('event_type', 'session_activity')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Last 10 minutes
        .order('created_at', { ascending: false });

      if (recentLogins && recentLogins.length > 3) {
        await logSuspiciousActivity('multiple_recent_sessions', {
          userId,
          sessionCount: recentLogins.length
        });
      }
    } catch (error) {
      console.error('Error checking concurrent sessions:', error);
    }
  };

  useEffect(() => {
    // Set up activity listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up session checking interval (check every 5 minutes instead of every minute)
    sessionCheckRef.current = setInterval(checkSessionTimeout, 5 * 60 * 1000); // Check every 5 minutes

    // Don't run initial session check immediately to avoid false positives
    // Let the user activity settle first

    return () => {
      // Cleanup
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current);
      }
    };
  }, [timeoutMinutes, maxIdleMinutes, detectConcurrentSessions]);

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, could be suspicious if session continues
        setTimeout(() => {
          if (document.hidden) {
            // Still hidden after delay, consider this suspicious
            logSuspiciousActivity('long_hidden_session', {
              hiddenDuration: Date.now() - lastActivityRef.current
            });
          }
        }, 5 * 60 * 1000); // 5 minutes
      } else {
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    isSessionValid,
    updateActivity,
    checkSessionTimeout: () => checkSessionTimeout(),
    timeUntilTimeout: () => {
      const maxIdleMs = maxIdleMinutes * 60 * 1000;
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      return Math.max(0, maxIdleMs - timeSinceActivity);
    },
    // Add method to manually reset activity (useful after login)
    resetActivity: () => {
      lastActivityRef.current = Date.now();
      setIsSessionValid(true);
    }
  };
}