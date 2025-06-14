
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";
import { UserRole } from "@/types/roles";
import { sanitizeInput, sanitizeEmail } from "@/utils/inputSanitizer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  userRole: UserRole | null;
  interfaceRole: UserRole | null;
  username: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username?: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [interfaceRole, setInterfaceRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuthStatus = () => {
    console.log('Auth status check triggered');
  };

  // Set up Supabase auth for all users
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          fetchUserProfile(session.user.id).finally(() => {
            if (mounted) {
              setIsInitialized(true);
            }
          });
        } else {
          setUserRole(null);
          setInterfaceRole(null);
          setUsername(null);
          setIsInitialized(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).finally(() => {
          if (mounted) {
            setIsInitialized(true);
          }
        });
      } else {
        setIsInitialized(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      // First try to get the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Set default admin role for users without profiles
        setUserRole('admin');
        setInterfaceRole('admin');
        setUsername(user?.email?.split('@')[0] || 'user');
        return;
      }
      
      if (profile) {
        console.log('User profile fetched:', profile);
        setUserRole(profile.role as UserRole);
        setInterfaceRole(profile.role as UserRole);
        setUsername(profile.username);
        
        // Check if this user is also an employee
        try {
          const { data: employee } = await supabase
            .from('employees')
            .select('first_name, last_name, position')
            .eq('profile_id', userId)
            .maybeSingle();
          
          if (employee) {
            console.log('User is also an employee:', employee);
            // Could set additional employee-specific data here if needed
          }
        } catch (error) {
          console.log('User is not an employee or error fetching employee data');
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserRole('admin'); // Fallback
      setInterfaceRole('admin');
    }
  };

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
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      toast.success('Logged out successfully');
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Logout failed', {
        description: error.message
      });
    }
  };

  const isLoggedIn = !!session || !!user;

  return (
    <AuthContext.Provider value={{ 
      user,
      session,
      isLoggedIn, 
      userRole, 
      interfaceRole,
      username, 
      login,
      signup, 
      logout,
      updateUserRole,
      checkAuthStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
