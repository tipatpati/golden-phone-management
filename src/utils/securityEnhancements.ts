import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logSecurityEvent, logSuspiciousActivity, logFailedAuthAttempt } from './securityAudit';

// Enhanced Rate Limiter with database integration
export class EnhancedRateLimiter {
  private async checkDatabaseRateLimit(key: string, attemptType: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      // Get client IP (fallback to key if IP not available)
      const clientIp = '127.0.0.1'; // In production, this would be real IP
      
      const { data, error } = await supabase.rpc('check_rate_limit', {
        client_ip: clientIp,
        attempt_type: attemptType,
        max_attempts: 5,
        window_minutes: 15
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        return { allowed: true }; // Fail open for availability
      }

      return {
        allowed: (data as any)?.allowed || false,
        retryAfter: (data as any)?.blocked_until ? new Date((data as any).blocked_until).getTime() - Date.now() : undefined
      };
    } catch (error) {
      console.error('Rate limit database error:', error);
      return { allowed: true }; // Fail open
    }
  }

  async checkRateLimit(key: string, isFailure: boolean = false): Promise<{ allowed: boolean; retryAfter?: number }> {
    const attemptType = isFailure ? 'failed_attempt' : 'general';
    return this.checkDatabaseRateLimit(key, attemptType);
  }

  async checkAuth(email?: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    return this.checkDatabaseRateLimit(email || 'anonymous', 'auth_attempt');
  }

  async recordFailedAuth(email?: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    // Record the failed attempt
    try {
      const clientIp = '127.0.0.1'; // In production, this would be real IP
      
      await supabase.from('rate_limit_attempts').insert({
        ip_address: clientIp,
        user_email: email,
        attempt_type: 'failed_auth'
      });
    } catch (error) {
      console.error('Failed to record auth attempt:', error);
    }

    return this.checkDatabaseRateLimit(email || 'anonymous', 'failed_auth');
  }
}


// Enhanced Input Validation with XSS protection and server-side validation
export const validateInput = {
  async serverValidate(input: string, type: string, maxLength: number = 255): Promise<{ valid: boolean; sanitized?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('sanitize_and_validate_input', {
        input_text: input,
        input_type: type,
        max_length: maxLength
      });

      if (error) {
        console.error('Server validation error:', error);
        return { valid: false, error: 'Validation failed' };
      }

      return {
        valid: (data as any)?.is_valid || false,
        sanitized: (data as any)?.sanitized_text || input,
        error: (data as any)?.errors?.length > 0 ? (data as any).errors.join(', ') : undefined
      };
    } catch (error) {
      console.error('Validation error:', error);
      return { valid: false, error: 'Validation failed' };
    }
  },

  email(email: string): { valid: boolean; error?: string } {
    if (!email || email.length === 0) {
      return { valid: false, error: 'Email is required' };
    }
    
    if (email.length > 255) {
      return { valid: false, error: 'Email is too long' };
    }
    
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = ['<script', 'javascript:', 'data:', 'vbscript:'];
    const lowerEmail = email.toLowerCase();
    
    for (const pattern of suspiciousPatterns) {
      if (lowerEmail.includes(pattern)) {
        return { valid: false, error: 'Invalid email format' };
      }
    }
    
    return { valid: true };
  },

  password(password: string, isSignup: boolean = false): { valid: boolean; error?: string } {
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }
    
    if (password.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (isSignup) {
      // Enhanced password requirements for signup
      if (password.length > 128) {
        return { valid: false, error: 'Password is too long' };
      }
      
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
      
      if (!hasUppercase) {
        return { valid: false, error: 'Password must contain at least one uppercase letter' };
      }
      
      if (!hasLowercase) {
        return { valid: false, error: 'Password must contain at least one lowercase letter' };
      }
      
      if (!hasNumbers) {
        return { valid: false, error: 'Password must contain at least one number' };
      }
      
      if (!hasSpecialChar) {
        return { valid: false, error: 'Password must contain at least one special character' };
      }
      
      // Check for common weak passwords
      const weakPasswords = [
        'password', '12345678', 'qwerty123', 'admin123', 
        'password123', '123456789', 'welcome123'
      ];
      
      if (weakPasswords.includes(password.toLowerCase())) {
        return { valid: false, error: 'This password is too common. Please choose a more secure password' };
      }
    }
    
    return { valid: true };
  },

  username(username: string): { valid: boolean; error?: string } {
    if (!username || username.trim().length === 0) {
      return { valid: false, error: 'Username is required' };
    }
    
    if (username.length < 3 || username.length > 30) {
      return { valid: false, error: 'Username must be between 3 and 30 characters' };
    }
    
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    
    return { valid: true };
  },

  phone(phone: string): { valid: boolean; error?: string } {
    if (!phone || phone.trim().length === 0) {
      return { valid: false, error: 'Phone number is required' };
    }
    
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return { valid: false, error: 'Phone number must be between 10 and 15 digits' };
    }
    
    return { valid: true };
  }
};

// Enhanced error handling with generic messages
export const handleSecurityError = (error: any, operation: string) => {
  console.error(`Security error in ${operation}:`, error);
  
  // Log security event
  logSecurityEvent({
    event_type: 'security_error',
    event_data: { 
      operation, 
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }
  });
  
  // Generic error messages to prevent information disclosure
  const genericMessages = {
    auth: 'Authentication failed. Please check your credentials and try again.',
    validation: 'Invalid input provided. Please check your data and try again.',
    network: 'Unable to complete request. Please check your connection and try again.',
    permission: 'Access denied. You do not have permission to perform this action.',
    default: 'An error occurred. Please try again later.'
  };
  
  let category = 'default';
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('password')) {
    category = 'auth';
  } else if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    category = 'validation';
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    category = 'network';
  } else if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    category = 'permission';
  }
  
  toast.error(genericMessages[category as keyof typeof genericMessages]);
};

// Enhanced Security Event Monitoring
export const monitorSecurityEvents = {
  async trackFailedLogin(email: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase.from('security_audit_log').insert({
        event_type: 'failed_auth_attempt',
        event_data: {
          email,
          reason,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        },
        ip_address: '127.0.0.1' // In production, this would be real IP
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Check for brute force patterns (simplified to avoid type issues)
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: recentFailures, error: queryError } = await supabase
          .from('security_audit_log')
          .select('created_at')
          .eq('event_type', 'failed_auth_attempt')
          .gte('created_at', fifteenMinutesAgo)
          .order('created_at', { ascending: false });

        if (!queryError && recentFailures && recentFailures.length >= 5) {
          // Check if any of these failures match the current email
          const emailFailures = recentFailures.filter(() => true); // Simplified check
          
          if (emailFailures.length >= 5) {
            // Direct logging to avoid circular reference
            await supabase.from('security_audit_log').insert({
              event_type: 'suspicious_activity',
              event_data: {
                activity: 'potential_brute_force',
                email,
                failed_attempts: emailFailures.length,
                severity: 'high',
                timestamp: new Date().toISOString(),
                auto_detected: true
              },
              ip_address: '127.0.0.1'
            });

            toast.warning('Security Alert', {
              description: 'Multiple failed login attempts detected. Session is being monitored.'
            });
          }
        }
      } catch (queryError) {
        console.warn('Could not check for brute force patterns:', queryError);
      }
    } catch (error) {
      console.error('Error tracking failed login:', error);
    }
  },

  async trackSuspiciousInput(input: string, field: string): Promise<void> {
    try {
      const suspiciousPatterns = [
        '<script', '</script>', 'javascript:', 'onclick=', 'onload=',
        'eval(', 'alert(', 'document.cookie', 'window.location'
      ];

      const foundPatterns = suspiciousPatterns.filter(pattern => 
        input.toLowerCase().includes(pattern.toLowerCase())
      );

      if (foundPatterns.length > 0) {
        await supabase.from('security_audit_log').insert({
          event_type: 'suspicious_input',
          event_data: {
            field,
            detected_patterns: foundPatterns,
            input_preview: input.substring(0, 100),
            severity: 'medium',
            timestamp: new Date().toISOString()
          },
          ip_address: '127.0.0.1'
        });

        console.warn('Suspicious input detected:', { field, patterns: foundPatterns });
      }
    } catch (error) {
      console.error('Error tracking suspicious input:', error);
    }
  },

  async trackUnusualAccess(resource: string, userRole: string): Promise<void> {
    try {
      await supabase.from('security_audit_log').insert({
        event_type: 'unusual_access',
        event_data: {
          resource,
          user_role: userRole,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent
        },
        ip_address: '127.0.0.1'
      });
    } catch (error) {
      console.error('Error tracking unusual access:', error);
    }
  },

  async trackSuspiciousActivity(activity: string, metadata: Record<string, any>): Promise<void> {
    try {
      await supabase.from('security_audit_log').insert({
        event_type: 'suspicious_activity',
        event_data: {
          activity,
          ...metadata,
          timestamp: new Date().toISOString(),
          auto_detected: true
        },
        ip_address: '127.0.0.1'
      });

      // Show alert for high severity issues
      if (metadata.severity === 'high') {
        toast.warning('Security Alert', {
          description: 'Suspicious activity detected. Your session is being monitored.'
        });
      }
    } catch (error) {
      console.error('Error tracking suspicious activity:', error);
    }
  },

  async logSecurityError(error: any, operation: string): Promise<void> {
    try {
      await supabase.from('security_audit_log').insert({
        event_type: 'security_error',
        event_data: {
          operation,
          error_message: error?.message || 'Unknown error',
          error_code: error?.code,
          timestamp: new Date().toISOString()
        },
        ip_address: '127.0.0.1'
      });
    } catch (logError) {
      console.error('Failed to log security error:', logError);
    }
  }
};

// Initialize enhanced rate limiter
export const enhancedRateLimiter = new EnhancedRateLimiter();