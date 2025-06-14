
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "@/components/ui/sonner";
import { UserRole } from "@/types/roles";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  userRole: UserRole | null;
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
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuthStatus = () => {
    console.log('Auth status check triggered');
  };

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
        // If profile doesn't exist, it will be created by the trigger
        if (error.code === 'PGRST116') {
          console.log('Profile not found, should be created by trigger');
          // Set default values temporarily
          setUserRole('salesperson');
          setUsername(user?.email?.split('@')[0] || 'user');
        }
        return;
      }
      
      if (data) {
        console.log('User profile fetched:', data);
        setUserRole(data.role as UserRole);
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to default role
      setUserRole('salesperson');
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Successfully logged in');
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
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username || email.split('@')[0],
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
    } catch (error: any) {
      console.error('Logout failed:', error);
      toast.error('Logout failed', {
        description: error.message
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile in background without blocking
          fetchUserProfile(session.user.id).finally(() => {
            if (mounted) {
              setIsInitialized(true);
            }
          });
        } else {
          setUserRole(null);
          setUsername(null);
          setIsInitialized(true);
        }
      }
    );

    // Check for existing session
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

  const isLoggedIn = !!session && !!user;

  return (
    <AuthContext.Provider value={{ 
      user,
      session,
      isLoggedIn, 
      userRole, 
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
