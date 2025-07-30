import { toast } from '@/components/ui/sonner';
import { logSecurityEvent, logSuspiciousActivity, logFailedAuthAttempt } from './securityAudit';

// Enhanced rate limiting with progressive delays and IP tracking
class EnhancedRateLimiter {
  private attempts = new Map<string, { 
    count: number; 
    resetTime: number; 
    failures: number;
    blockedUntil?: number;
  }>();
  
  private readonly BASE_LIMIT = 5; // Base requests per window
  private readonly WINDOW_MS = 60000; // 1 minute
  private readonly FAILURE_THRESHOLD = 3; // Failed attempts before blocking
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  checkRateLimit(key: string, isFailure = false): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    // Check if currently blocked
    if (record?.blockedUntil && now < record.blockedUntil) {
      return { 
        allowed: false, 
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000) 
      };
    }

    // Reset window if expired
    if (!record || now > record.resetTime) {
      this.attempts.set(key, { 
        count: 1, 
        resetTime: now + this.WINDOW_MS,
        failures: isFailure ? 1 : 0
      });
      return { allowed: true };
    }

    // Track failures
    if (isFailure) {
      record.failures++;
      
      // Block if too many failures
      if (record.failures >= this.FAILURE_THRESHOLD) {
        record.blockedUntil = now + this.BLOCK_DURATION_MS;
        
        // Log suspicious activity
        logSuspiciousActivity('rate_limit_exceeded', {
          key,
          failures: record.failures,
          blockedUntil: record.blockedUntil
        });
        
        return { 
          allowed: false, 
          retryAfter: Math.ceil(this.BLOCK_DURATION_MS / 1000) 
        };
      }
    }

    // Check rate limit with dynamic adjustment based on failures
    const adjustedLimit = Math.max(1, this.BASE_LIMIT - record.failures);
    
    if (record.count >= adjustedLimit) {
      return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) };
    }

    record.count++;
    return { allowed: true };
  }

  // Get client IP (fallback for client-side implementation)
  private getClientKey(): string {
    // In a real implementation, this would be done server-side
    // For now, use a combination of user agent and local factors
    const userAgent = navigator.userAgent;
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return btoa(`${userAgent}-${screenInfo}-${timezone}`).slice(0, 16);
  }

  checkAuth(email?: string): { allowed: boolean; retryAfter?: number } {
    const key = email ? `auth_${email}` : `auth_${this.getClientKey()}`;
    return this.checkRateLimit(key, false);
  }

  recordFailedAuth(email?: string): { allowed: boolean; retryAfter?: number } {
    const key = email ? `auth_${email}` : `auth_${this.getClientKey()}`;
    return this.checkRateLimit(key, true);
  }
}

export const enhancedRateLimiter = new EnhancedRateLimiter();

// Comprehensive input validation with specific error messages
export const validateInput = {
  email: (email: string): { valid: boolean; error?: string } => {
    if (!email) return { valid: false, error: 'Email is required' };
    if (email.length > 254) return { valid: false, error: 'Email is too long' };
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }
    
    // Check for suspicious patterns
    if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
      return { valid: false, error: 'Invalid email format' };
    }
    
    return { valid: true };
  },

  password: (password: string, isSignup = false): { valid: boolean; error?: string } => {
    if (!password) return { valid: false, error: 'Password is required' };
    if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
    if (password.length > 128) return { valid: false, error: 'Password is too long' };
    
    if (isSignup) {
      // Stronger validation for signup only
      if (!/[A-Za-z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one letter' };
      }
      if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
      }
      
      // Check for common weak passwords only during signup
      const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'login'];
      if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        return { valid: false, error: 'Password is too common. Please choose a stronger password' };
      }
    }
    
    return { valid: true };
  },

  username: (username: string): { valid: boolean; error?: string } => {
    if (!username) return { valid: true }; // Username is optional
    if (username.length > 50) return { valid: false, error: 'Username is too long' };
    if (username.length < 2) return { valid: false, error: 'Username must be at least 2 characters' };
    
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(username)) {
      return { valid: false, error: 'Username can only contain letters, numbers, dots, hyphens, and underscores' };
    }
    
    return { valid: true };
  },

  phone: (phone: string): { valid: boolean; error?: string } => {
    if (!phone) return { valid: true }; // Phone is optional in most contexts
    
    // Remove formatting
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    if (cleanPhone.length < 10) {
      return { valid: false, error: 'Phone number is too short' };
    }
    if (cleanPhone.length > 15) {
      return { valid: false, error: 'Phone number is too long' };
    }
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return { valid: false, error: 'Please enter a valid phone number' };
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

// Security monitoring for unusual patterns
export const monitorSecurityEvents = {
  trackFailedLogin: async (email: string, reason: string) => {
    await logFailedAuthAttempt(email, reason);
    
    // Check for brute force patterns
    const recentFailures = await checkRecentFailures(email);
    if (recentFailures > 5) {
      await logSuspiciousActivity('potential_brute_force', {
        email,
        failureCount: recentFailures,
        timeWindow: '10 minutes'
      });
    }
  },

  trackSuspiciousInput: async (input: string, field: string) => {
    // Check for XSS attempts
    const xssPatterns = [
      /<script/i, /javascript:/i, /on\w+=/i, /eval\(/i, 
      /expression\(/i, /vbscript:/i, /data:text\/html/i
    ];
    
    if (xssPatterns.some(pattern => pattern.test(input))) {
      await logSuspiciousActivity('potential_xss_attempt', {
        field,
        inputLength: input.length,
        patterns: xssPatterns.filter(pattern => pattern.test(input)).map(p => p.source)
      });
    }
  },

  trackUnusualAccess: async (resource: string, userRole: string) => {
    // Log access to sensitive resources
    const sensitiveResources = ['admin', 'security', 'audit', 'users', 'roles'];
    
    if (sensitiveResources.some(sensitive => resource.includes(sensitive))) {
      await logSecurityEvent({
        event_type: 'sensitive_resource_access',
        event_data: { resource, userRole, timestamp: new Date().toISOString() }
      });
    }
  }
};

// Helper function to check recent failures (would be implemented server-side in production)
async function checkRecentFailures(email: string): Promise<number> {
  try {
    // This is a simplified client-side check
    // In production, this should be done server-side
    const failures = localStorage.getItem(`failures_${btoa(email)}`);
    return failures ? parseInt(failures) : 0;
  } catch {
    return 0;
  }
}