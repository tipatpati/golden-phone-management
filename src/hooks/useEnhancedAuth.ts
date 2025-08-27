import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { enhancedRateLimiter, validateInput, monitorSecurityEvents, handleSecurityError } from '@/utils/securityEnhancements';
import { SessionSecurityManager } from '@/utils/sessionSecurity';

interface AuthAttempt {
  email: string;
  password: string;
  isSignup?: boolean;
  username?: string;
}

export function useEnhancedAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const sessionSecurity = SessionSecurityManager.getInstance();

  const validateAuthInput = useCallback(async (attempt: AuthAttempt): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = [];

    // Client-side validation
    const emailValidation = validateInput.email(attempt.email);
    if (!emailValidation.valid) {
      errors.push(emailValidation.error!);
    }

    const passwordValidation = validateInput.password(attempt.password, attempt.isSignup);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.error!);
    }

    if (attempt.username) {
      const usernameValidation = validateInput.username(attempt.username);
      if (!usernameValidation.valid) {
        errors.push(usernameValidation.error!);
      }
    }

    // Server-side validation for enhanced security
    if (errors.length === 0) {
      try {
        const emailServerValidation = await validateInput.serverValidate(attempt.email, 'email');
        if (!emailServerValidation.valid) {
          errors.push(emailServerValidation.error!);
        }

        // Track suspicious input attempts
        await monitorSecurityEvents.trackSuspiciousInput(attempt.email, 'email');
        if (attempt.username) {
          await monitorSecurityEvents.trackSuspiciousInput(attempt.username, 'username');
        }
      } catch (error) {
        console.error('Server validation failed:', error);
        // Continue with client-side validation only
      }
    }

    return { valid: errors.length === 0, errors };
  }, []);

  const enhancedLogin = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Rate limiting check
      const rateLimitCheck = await enhancedRateLimiter.checkAuth(email);
      if (!rateLimitCheck.allowed) {
        const waitMinutes = Math.ceil((rateLimitCheck.retryAfter || 0) / 60);
        toast.error('Too Many Attempts', {
          description: `Please wait ${waitMinutes} minutes before trying again.`
        });
        return { success: false, error: 'Rate limit exceeded' };
      }

      // Input validation
      const validation = await validateAuthInput({ email, password });
      if (!validation.valid) {
        await enhancedRateLimiter.recordFailedAuth(email);
        await monitorSecurityEvents.trackFailedLogin(email, `Validation failed: ${validation.errors.join(', ')}`);
        
        toast.error('Invalid Input', {
          description: validation.errors[0]
        });
        return { success: false, error: validation.errors[0] };
      }

      // Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await enhancedRateLimiter.recordFailedAuth(email);
        await monitorSecurityEvents.trackFailedLogin(email, error.message);
        
        handleSecurityError(error, 'login');
        return { success: false, error: error.message };
      }

      if (data.session) {
        // Success - log session activity and check for suspicious patterns
        sessionSecurity.setSessionId(data.session.access_token.substring(0, 16));
        await sessionSecurity.logSessionActivity('login', data.user?.id);
        
        // Check for suspicious session activity
        if (data.user?.id) {
          const isSuspicious = await sessionSecurity.checkSuspiciousActivity(data.user.id);
          if (isSuspicious) {
            toast.warning('Security Notice', {
              description: 'Unusual login activity detected. Please secure your account.'
            });
          }
        }
        
        toast.success('Login Successful', {
          description: 'Welcome back!'
        });
      }

      return { success: true };
    } catch (error: any) {
      await enhancedRateLimiter.recordFailedAuth(email);
      await monitorSecurityEvents.trackFailedLogin(email, error.message || 'Unknown error');
      
      handleSecurityError(error, 'login');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [validateAuthInput, sessionSecurity]);

  const enhancedSignup = useCallback(async (email: string, password: string, username?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Rate limiting check
      const rateLimitCheck = await enhancedRateLimiter.checkAuth(email);
      if (!rateLimitCheck.allowed) {
        const waitMinutes = Math.ceil((rateLimitCheck.retryAfter || 0) / 60);
        toast.error('Too Many Attempts', {
          description: `Please wait ${waitMinutes} minutes before trying again.`
        });
        return { success: false, error: 'Rate limit exceeded' };
      }

      // Enhanced input validation for signup
      const validation = await validateAuthInput({ email, password, username, isSignup: true });
      if (!validation.valid) {
        await enhancedRateLimiter.recordFailedAuth(email);
        await monitorSecurityEvents.trackFailedLogin(email, `Signup validation failed: ${validation.errors.join(', ')}`);
        
        toast.error('Invalid Input', {
          description: validation.errors[0]
        });
        return { success: false, error: validation.errors[0] };
      }

      // Check for leaked passwords (this would be enhanced with server-side checking)
      const passwordCheck = validateInput.password(password, true);
      if (!passwordCheck.valid) {
        toast.error('Weak Password', {
          description: passwordCheck.error
        });
        return { success: false, error: passwordCheck.error };
      }

      // Attempt signup
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: username ? { username } : undefined
        }
      });

      if (error) {
        await enhancedRateLimiter.recordFailedAuth(email);
        await monitorSecurityEvents.trackFailedLogin(email, `Signup failed: ${error.message}`);
        
        handleSecurityError(error, 'signup');
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Log successful signup
        await supabase.from('security_audit_log').insert({
          event_type: 'user_signup',
          event_data: {
            user_id: data.user.id,
            email,
            timestamp: new Date().toISOString(),
            confirmation_required: !data.session
          },
          user_id: data.user.id,
          ip_address: '127.0.0.1'
        });

        if (data.session) {
          sessionSecurity.setSessionId(data.session.access_token.substring(0, 16));
          await sessionSecurity.logSessionActivity('login', data.user.id);
        }

        toast.success('Account Created', {
          description: data.session 
            ? 'Welcome! Your account has been created successfully.'
            : 'Please check your email to confirm your account.'
        });
      }

      return { success: true };
    } catch (error: any) {
      await enhancedRateLimiter.recordFailedAuth(email);
      await monitorSecurityEvents.trackFailedLogin(email, error.message || 'Signup error');
      
      handleSecurityError(error, 'signup');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [validateAuthInput, sessionSecurity]);

  const enhancedLogout = useCallback(async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await sessionSecurity.logSessionActivity('logout', user.id);
      }

      await supabase.auth.signOut();
      
      toast.success('Logged Out', {
        description: 'You have been logged out successfully.'
      });
    } catch (error: any) {
      handleSecurityError(error, 'logout');
    }
  }, [sessionSecurity]);

  const enhancedPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      // Rate limiting for password reset
      const rateLimitCheck = await enhancedRateLimiter.checkAuth(`reset_${email}`);
      if (!rateLimitCheck.allowed) {
        const waitMinutes = Math.ceil((rateLimitCheck.retryAfter || 0) / 60);
        toast.error('Too Many Reset Attempts', {
          description: `Please wait ${waitMinutes} minutes before requesting another reset.`
        });
        return { success: false, error: 'Rate limit exceeded' };
      }

      // Validate email
      const emailValidation = validateInput.email(email);
      if (!emailValidation.valid) {
        toast.error('Invalid Email', {
          description: emailValidation.error
        });
        return { success: false, error: emailValidation.error };
      }

      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        await enhancedRateLimiter.recordFailedAuth(`reset_${email}`);
        await monitorSecurityEvents.trackFailedLogin(email, `Password reset failed: ${error.message}`);
        
        handleSecurityError(error, 'password_reset');
        return { success: false, error: error.message };
      }

      // Log password reset request
      await supabase.from('security_audit_log').insert({
        event_type: 'password_reset_requested',
        event_data: {
          email,
          timestamp: new Date().toISOString()
        },
        ip_address: '127.0.0.1'
      });

      toast.success('Reset Email Sent', {
        description: 'Please check your email for password reset instructions.'
      });

      return { success: true };
    } catch (error: any) {
      await enhancedRateLimiter.recordFailedAuth(`reset_${email}`);
      handleSecurityError(error, 'password_reset');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    enhancedLogin,
    enhancedSignup,
    enhancedLogout,
    enhancedPasswordReset,
    validateAuthInput
  };
}