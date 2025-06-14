import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";
import { UserRole } from "@/types/roles";
import { authApi } from "@/services/auth";
import { secureStorage } from "@/services/secureStorage";
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

  // Check for mock auth on initialization
  useEffect(() => {
    const checkMockAuth = () => {
      const token = secureStorage.getItem('authToken', true);
      const storedRole = secureStorage.getItem('userRole', false) as UserRole;
      const storedInterfaceRole = secureStorage.getItem('interfaceRole', false) as UserRole;
      const storedUserId = secureStorage.getItem('userId', false);
      
      if (token && storedRole && storedUserId) {
        console.log('Found existing mock auth session');
        setUserRole(storedRole);
        setInterfaceRole(storedInterfaceRole || storedRole);
        setUsername(storedUserId);
        // Create a mock user object for consistency
        const mockUser = {
          id: storedUserId,
          email: storedUserId,
        } as User;
        setUser(mockUser);
        setIsInitialized(true);
        return true;
      }
      return false;
    };

    // Check mock auth first
    if (checkMockAuth()) {
      return;
    }

    // If no mock auth, set up Supabase auth
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
      const { data, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        if (error.code === 'PGRST116') {
          console.log('Profile not found, should be created by trigger');
          setUserRole('admin'); // Default admin for Supabase users
          setInterfaceRole('admin');
          setUsername(user?.email?.split('@')[0] || 'admin');
        }
        return;
      }
      
      if (data) {
        console.log('User profile fetched:', data);
        setUserRole(data.role as UserRole);
        setInterfaceRole(data.role as UserRole); // Default to same as user role
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserRole('admin'); // Fallback to admin for Supabase
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
      
      // Check if this should be a mock login (employees) or Supabase login (admin)
      if (window.location.pathname === '/employee-login') {
        // Check for existing stored interface role for admins
        const storedInterfaceRole = secureStorage.getItem('interfaceRole', false) as UserRole;
        
        // Use mock auth for employees or admin with interface role
        const result = await authApi.login(sanitizedEmail, sanitizedPassword);
        
        // Create mock user for consistency
        const mockUser = {
          id: sanitizedEmail,
          email: sanitizedEmail,
        } as User;
        
        setUser(mockUser);
        setUsername(sanitizedEmail);
        
        // Get roles from storage (set during login process)
        const actualRole = secureStorage.getItem('userRole', false) as UserRole;
        const displayRole = storedInterfaceRole || actualRole || 'salesperson';
        
        setUserRole(actualRole || 'salesperson');
        setInterfaceRole(displayRole);
        
        toast.success('Successfully logged in');
        
        // Redirect to main dashboard after successful employee login
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
        
        return;
      }
      
      // Use Supabase auth for admin
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Successfully logged in');
      
      // Redirect to admin dashboard after successful login
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
      // Check if this is a mock auth session
      const token = secureStorage.getItem('authToken', true);
      if (token && token.startsWith('mock-') || token?.startsWith('admin-token')) {
        // Use mock auth logout
        authApi.logout();
        // Clear interface role as well
        secureStorage.removeItem('interfaceRole');
        setUser(null);
        setSession(null);
        setUserRole(null);
        setInterfaceRole(null);
        setUsername(null);
        // Redirect to home page after logout
        window.location.href = '/';
        return;
      }
      
      // Use Supabase logout
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
