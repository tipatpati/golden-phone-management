
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { UserRole } from "@/types/roles";
import { validation } from "@/utils/validation";
import { logFailedAuthAttempt } from "@/utils/securityAudit";
import { handleSecurityError } from "@/utils/securityEnhancements";
import { User } from "@supabase/supabase-js";
import { log } from "@/utils/logger";

interface AuthActionsParams {
  user: User | null;
  setUserRole: (role: UserRole | null) => void;
  setInterfaceRole: (role: UserRole | null) => void;
  setUsername: (username: string | null) => void;
  setUser: (user: User | null) => void;
  setSession: (session: any) => void;
}

export function createAuthActions(params: AuthActionsParams) {
  const { user, setUserRole, setInterfaceRole, setUsername, setUser, setSession } = params;

  const updateUserRole = async (targetUserId: string, role: UserRole) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      // Use the secure admin function instead of direct profile update
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: targetUserId,
        new_role: role
      });

      if (error) {
        throw error;
      }

      // Only update local state if updating current user
      if (targetUserId === user.id) {
        setUserRole(role);
        setInterfaceRole(role);
      }
      
      log.info('Role updated successfully', { targetUserId, role }, 'AuthActions');
      toast.success(`Role updated to ${role}`);
    } catch (error: any) {
      log.error('Error updating user role', { error: error.message, targetUserId, role }, 'AuthActions');
      toast.error('Failed to update role', {
        description: error.message || 'Only admins can change user roles'
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    // Validate and sanitize inputs using centralized validation
    const emailValidation = validation.email(email);
    const passwordValidation = validation.password(password);
    
    try {
      if (!emailValidation.isValid) {
        toast.error('Invalid email', { description: emailValidation.error });
        throw new Error('Invalid email format');
      }
      
      if (!passwordValidation.isValid) {
        toast.error('Invalid password', { description: passwordValidation.error });
        throw new Error('Invalid password format');
      }
      
      // Use Supabase auth for all users now
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailValidation.sanitizedValue,
        password: passwordValidation.sanitizedValue,
      });
      
      if (error) {
        throw error;
      }
      
      log.info('User login successful', { email: emailValidation.sanitizedValue }, 'AuthActions');
      toast.success('Successfully logged in');
      
      // Don't force a page reload - let React Router handle navigation
      // React Router will automatically redirect based on authentication state
      
    } catch (error: any) {
      log.error('Login failed', { error: error.message, email: emailValidation.sanitizedValue }, 'AuthActions');
      
      // Log failed auth attempt for security monitoring
      const emailToLog = emailValidation.sanitizedValue || email;
      await logFailedAuthAttempt(emailToLog, error.message || 'Authentication failed');
      
      toast.error('Login failed', {
        description: error.message || 'Please check your credentials'
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, username?: string, role: UserRole = 'salesperson') => {
    try {
      // Validate and sanitize inputs using centralized validation
      const emailValidation = validation.email(email);
      const passwordValidation = validation.password(password, { isSignup: true });
      const usernameValidation = validation.username(username || email.split('@')[0]);
      
      if (!emailValidation.isValid) {
        toast.error('Invalid email', { description: emailValidation.error });
        throw new Error('Invalid email format');
      }
      
      if (!passwordValidation.isValid) {
        toast.error('Invalid password', { description: passwordValidation.error });
        throw new Error('Invalid password format');
      }
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: emailValidation.sanitizedValue,
        password: passwordValidation.sanitizedValue,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: usernameValidation.sanitizedValue,
            role: role,
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user && !data.session) {
        log.info('User signup initiated, email confirmation required', { email: emailValidation.sanitizedValue }, 'AuthActions');
        toast.success('Check your email for confirmation link');
      } else {
        log.info('User signup completed', { email: emailValidation.sanitizedValue }, 'AuthActions');
        toast.success('Account created successfully');
        // Let React Router handle navigation automatically
      }
    } catch (error: any) {
      log.error('Signup failed', { error: error.message }, 'AuthActions');
      toast.error('Signup failed', {
        description: error.message || 'Please try again'
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      log.debug('Logout initiated...', null, 'AuthActions');
      
      // Clear local state first to prevent UI issues
      setUser(null);
      setSession(null);
      setUserRole(null);
      setInterfaceRole(null);
      setUsername(null);
      
      // Try to sign out from Supabase, but don't fail if session is missing
      const { error } = await supabase.auth.signOut();
      
      // Only throw error if it's not about missing session
      if (error && !error.message?.includes('session') && !error.message?.includes('not found')) {
        throw error;
      }
      
      log.info('User logout successful', null, 'AuthActions');
      toast.success('Logged out successfully');
      // Let React Router handle navigation automatically
      
    } catch (error: any) {
      log.error('Logout failed', error, 'AuthActions');
      
      // Even if logout fails, clear local state and redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      setInterfaceRole(null);
      setUsername(null);
      
      toast.success('Logged out successfully');
      // Let React Router handle navigation automatically
    }
  };

  const checkAuthStatus = () => {
    log.debug('Auth status check triggered', null, 'AuthActions');
  };

  return {
    updateUserRole,
    login,
    signup,
    logout,
    checkAuthStatus
  };
}
