import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { monitorSecurityEvents } from './securityEnhancements';

// Session Security Manager
export class SessionSecurityManager {
  private static instance: SessionSecurityManager;
  private sessionId: string = '';
  private lastActivity: number = Date.now();
  private activityCheckInterval: number | null = null;
  private suspiciousActivityCount: number = 0;

  static getInstance(): SessionSecurityManager {
    if (!SessionSecurityManager.instance) {
      SessionSecurityManager.instance = new SessionSecurityManager();
    }
    return SessionSecurityManager.instance;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
    this.updateActivity();
    this.startActivityMonitoring();
  }

  updateActivity(): void {
    this.lastActivity = Date.now();
  }

  private startActivityMonitoring(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }

    // Check for suspicious activity every 2 minutes
    this.activityCheckInterval = window.setInterval(() => {
      this.checkSessionSecurity();
    }, 2 * 60 * 1000);

    // Set up activity listeners
    this.setupActivityListeners();
  }

  private setupActivityListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, { passive: true });
    });

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logSuspiciousActivity('page_hidden_extended');
      } else {
        this.updateActivity();
      }
    });

    // Monitor for developer tools
    let devtools = { open: false };
    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.logSuspiciousActivity('developer_tools_detected');
        }
      } else {
        devtools.open = false;
      }
    }, 1000);
  }

  private async checkSessionSecurity(): Promise<void> {
    const now = Date.now();
    const inactiveTime = now - this.lastActivity;
    
    // 30 minutes of inactivity
    if (inactiveTime > 30 * 60 * 1000) {
      await this.handleSessionTimeout();
      return;
    }

    // Check for multiple tabs/windows
    if (this.sessionId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const isSuspicious = await this.checkSuspiciousActivity(user.id);
          if (isSuspicious) {
            this.suspiciousActivityCount++;
            
            if (this.suspiciousActivityCount >= 3) {
              await this.handleSuspiciousSession(user.id);
            }
          }
        }
      } catch (error) {
        console.error('Session security check failed:', error);
      }
    }
  }

  async checkSuspiciousActivity(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('detect_suspicious_session_activity', {
        target_user_id: userId
      });

      if (error) {
        console.error('Failed to check suspicious activity:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
      return false;
    }
  }

  async logSessionActivity(activity: 'login' | 'logout' | 'timeout' | 'suspicious', userId?: string): Promise<void> {
    try {
      await supabase.from('security_audit_log').insert({
        event_type: 'session_activity',
        event_data: {
          activity,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          last_activity: new Date(this.lastActivity).toISOString()
        },
        user_id: userId,
        ip_address: '127.0.0.1' // In production, this would be real IP
      });

      if (activity === 'login' && userId) {
        // Check for suspicious patterns after login
        const isSuspicious = await this.checkSuspiciousActivity(userId);
        if (isSuspicious) {
          await monitorSecurityEvents.trackSuspiciousActivity('concurrent_sessions', {
            user_id: userId,
            severity: 'high',
            session_id: this.sessionId
          });
        }
      }
    } catch (error) {
      console.error('Error logging session activity:', error);
    }
  }

  private async handleSessionTimeout(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await this.logSessionActivity('timeout', user.id);
      }

      await supabase.auth.signOut();
      
      toast.warning('Session Expired', {
        description: 'Your session has expired due to inactivity. Please log in again.'
      });

      // Redirect to login
      window.location.href = '/';
    } catch (error) {
      console.error('Error handling session timeout:', error);
    }
  }

  private async handleSuspiciousSession(userId: string): Promise<void> {
    try {
      await this.logSessionActivity('suspicious', userId);
      
      // Force logout for security
      await supabase.auth.signOut();
      
      toast.error('Security Alert', {
        description: 'Suspicious activity detected. Your session has been terminated for security.'
      });

      // Redirect to login with security warning
      window.location.href = '/?security_warning=true';
    } catch (error) {
      console.error('Error handling suspicious session:', error);
    }
  }

  private async logSuspiciousActivity(activityType: string): Promise<void> {
    try {
      await monitorSecurityEvents.trackSuspiciousActivity(activityType, {
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        severity: 'medium'
      });
    } catch (error) {
      console.error('Error logging suspicious activity:', error);
    }
  }

  async validateCurrentSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return false;
      }

      // Check if session is close to expiring (within 5 minutes)
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expiresAt.getTime() - now.getTime() < fiveMinutes) {
        // Attempt to refresh
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error('Session refresh failed:', refreshError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  cleanup(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
  }
}

// Export singleton instance
export const sessionSecurity = SessionSecurityManager.getInstance();