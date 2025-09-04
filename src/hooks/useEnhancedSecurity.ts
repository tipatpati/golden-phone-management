import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityConfig {
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  sessionTimeout: number; // in minutes
  enableBruteForceProtection: boolean;
  enableAnomalyDetection: boolean;
}

interface SecurityState {
  isAccountLocked: boolean;
  failedAttempts: number;
  lockoutUntil?: Date;
  lastActivity: Date;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

const DEFAULT_CONFIG: SecurityConfig = {
  maxFailedAttempts: 5,
  lockoutDuration: 30,
  sessionTimeout: 60,
  enableBruteForceProtection: true,
  enableAnomalyDetection: true
};

export function useEnhancedSecurity(config: Partial<SecurityConfig> = {}) {
  const { user } = useAuth();
  const securityConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [securityState, setSecurityState] = useState<SecurityState>({
    isAccountLocked: false,
    failedAttempts: 0,
    lastActivity: new Date(),
    securityLevel: 'medium'
  });

  // Check account lockout status
  const checkAccountLockout = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('check_account_lockout', {
        user_email: email
      });

      if (error) {
        console.error('Lockout check failed:', error);
        return { locked: false, failure_count: 0 };
      }

      return data as { locked: boolean; failure_count: number; lockout_until?: string };
    } catch (error) {
      console.error('Security check error:', error);
      return { locked: false, failure_count: 0 };
    }
  }, []);

  // Enhanced login with security checks
  const secureLogin = useCallback(async (email: string, password: string) => {
    try {
      // Pre-login security checks
      const lockoutStatus = await checkAccountLockout(email);
      
      if (lockoutStatus.locked) {
        const lockoutUntil = lockoutStatus.lockout_until ? new Date(lockoutStatus.lockout_until) : null;
        const remainingTime = lockoutUntil ? Math.ceil((lockoutUntil.getTime() - Date.now()) / 60000) : 0;
        
        toast.error('Account Locked', {
          description: `Account temporarily locked due to multiple failed attempts. Try again in ${remainingTime} minutes.`,
          duration: 10000
        });
        
        return { success: false, error: 'Account temporarily locked', locked: true };
      }

      // Enhanced input validation
      const { data: emailValidation } = await supabase.rpc('enhanced_input_validation', {
        input_text: email,
        validation_type: 'email',
        max_length: 255
      });

      if (emailValidation && !(emailValidation as any).is_valid) {
        await supabase.from('security_audit_log').insert({
          event_type: 'invalid_login_input',
          event_data: {
            email,
            validation_errors: (emailValidation as any).errors,
            timestamp: new Date().toISOString()
          }
        });

        return { success: false, error: 'Invalid email format' };
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Log failed attempt
        await supabase.from('security_audit_log').insert({
          event_type: 'failed_auth_attempt',
          event_data: {
            email,
            reason: error.message,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });

        return { success: false, error: error.message };
      }

      // Log successful login
      await supabase.from('security_audit_log').insert({
        event_type: 'successful_login',
        event_data: {
          email,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Secure login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  }, [checkAccountLockout]);

  // Monitor session activity
  const updateActivity = useCallback(() => {
    setSecurityState(prev => ({
      ...prev,
      lastActivity: new Date()
    }));
  }, []);

  // Check for session timeout
  const checkSessionTimeout = useCallback(() => {
    const now = new Date();
    const timeSinceActivity = now.getTime() - securityState.lastActivity.getTime();
    const timeoutMs = securityConfig.sessionTimeout * 60 * 1000;

    if (timeSinceActivity > timeoutMs && user) {
      toast.warning('Session Timeout', {
        description: 'Your session has expired due to inactivity. Please log in again.',
        duration: 10000
      });

      // Log session timeout
      supabase.from('security_audit_log').insert({
        event_type: 'session_timeout',
        event_data: {
          user_id: user.id,
          inactive_duration: Math.round(timeSinceActivity / 60000),
          timestamp: new Date().toISOString()
        }
      });

      // Sign out user
      supabase.auth.signOut();
      return true;
    }

    return false;
  }, [securityState.lastActivity, securityConfig.sessionTimeout, user]);

  // Validate input with enhanced security
  const validateSecureInput = useCallback(async (
    input: string, 
    type: string, 
    maxLength = 1000
  ) => {
    try {
      const { data, error } = await supabase.rpc('enhanced_input_validation', {
        input_text: input,
        validation_type: type,
        max_length: maxLength
      });

      if (error) {
        console.error('Input validation error:', error);
        return { valid: false, error: 'Validation failed' };
      }

      return {
        valid: (data as any).is_valid,
        sanitized: (data as any).sanitized_text,
        errors: (data as any).errors
      };
    } catch (error) {
      console.error('Security validation error:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }, []);

  // Monitor for anomalies
  useEffect(() => {
    if (!securityConfig.enableAnomalyDetection || !user) return;

    const anomalyInterval = setInterval(() => {
      // Check for unusual activity patterns
      const checkAnomalies = async () => {
        try {
          const { data: recentActivity } = await supabase
            .from('security_audit_log')
            .select('event_type, created_at, event_data')
            .eq('user_id', user.id)
            .gte('created_at', new Date(Date.now() - 600000).toISOString()) // Last 10 minutes
            .order('created_at', { ascending: false });

          if (recentActivity && recentActivity.length > 50) {
            // Unusual activity detected
            setSecurityState(prev => ({ ...prev, securityLevel: 'high' }));
            
            toast.warning('Security Alert', {
              description: 'Unusual activity detected on your account.',
              duration: 10000
            });
          }
        } catch (error) {
          console.error('Anomaly detection error:', error);
        }
      };

      checkAnomalies();
    }, 300000); // Check every 5 minutes

    return () => clearInterval(anomalyInterval);
  }, [user, securityConfig.enableAnomalyDetection]);

  // Activity monitoring
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check session timeout periodically
    const timeoutInterval = setInterval(checkSessionTimeout, 60000); // Every minute

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(timeoutInterval);
    };
  }, [updateActivity, checkSessionTimeout]);

  return {
    securityState,
    secureLogin,
    checkAccountLockout,
    validateSecureInput,
    updateActivity,
    checkSessionTimeout
  };
}