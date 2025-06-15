
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { UserRole } from "@/types/roles";
import { sanitizeInput, sanitizeEmail } from "@/utils/inputSanitizer";
import { User } from "@supabase/supabase-js";

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

  const updateUserRole = async (role: UserRole) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setUserRole(role);
      setInterfaceRole(role);
      toast.success(`Role updated to ${role}`);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update role', {
        description: error.message
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedPassword = sanitizeInput(password);
      
      if (!sanitizedEmail || !sanitizedPassword) {
        toast.error('Invalid email or password format');
        throw new Error('Invalid credentials format');
      }
      
      // Use Supabase auth for all users now
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Successfully logged in');
      
      // Redirect to main dashboard after successful login
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error('Login failed', {
        description: error.message || 'Please check your credentials'
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, username?: string, role: UserRole = 'salesperson') => {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedPassword = sanitizeInput(password);
      const sanitizedUsername = username ? sanitizeInput(username) : sanitizedEmail.split('@')[0];
      
      if (!sanitizedEmail || !sanitizedPassword) {
        toast.error('Invalid email or password format');
        throw new Error('Invalid credentials format');
      }
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: sanitizedPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: sanitizedUsername,
            role: role,
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.user && !data.session) {
        toast.success('Check your email for confirmation link');
      } else {
        toast.success('Account created successfully');
        // Redirect to dashboard after successful signup
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast.error('Signup failed', {
        description: error.message || 'Please try again'
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logout initiated...');
      
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
      
      toast.success('Logged out successfully');
      
      // Redirect to home page after logout
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error: any) {
      console.error('Logout failed:', error);
      
      // Even if logout fails, clear local state and redirect
      setUser(null);
      setSession(null);
      setUserRole(null);
      setInterfaceRole(null);
      setUsername(null);
      
      toast.success('Logged out successfully');
      
      // Still redirect even if there was an error
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const checkAuthStatus = () => {
    console.log('Auth status check triggered');
  };

  return {
    updateUserRole,
    login,
    signup,
    logout,
    checkAuthStatus
  };
}
