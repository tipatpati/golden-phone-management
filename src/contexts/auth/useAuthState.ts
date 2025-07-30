
import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { UserRole } from "@/types/roles";
import { supabase } from "@/integrations/supabase/client";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [interfaceRole, setInterfaceRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
      });
      
      // First try to get the profile with timeout
      const profilePromise = supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userId)
        .single();
      
      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;
      
      if (profileError || !profile) {
        console.error('Error fetching user profile or no profile found:', profileError);
        // Set default admin role for users without profiles
        setUserRole('admin');
        setInterfaceRole('admin');
        // Get user email from the current session for username
        try {
          const currentSession = await supabase.auth.getSession();
          const userEmail = currentSession.data.session?.user?.email;
          setUsername(userEmail?.split('@')[0] || 'user');
        } catch (sessionError) {
          console.error('Error getting session for username:', sessionError);
          setUsername('admin');
        }
        return;
      }
      
      if (profile) {
        console.log('User profile fetched:', profile);
        setUserRole(profile.role as UserRole);
        setInterfaceRole(profile.role as UserRole);
        setUsername(profile.username || 'user');
        
        // Check if this user is also an employee (with timeout)
        try {
          const employeeTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Employee fetch timeout')), 5000);
          });
          
          const employeePromise = supabase
            .from('employees')
            .select('first_name, last_name, position')
            .eq('profile_id', userId)
            .maybeSingle();
          
          const { data: employee } = await Promise.race([
            employeePromise,
            employeeTimeoutPromise
          ]) as any;
          
          if (employee) {
            console.log('User is also an employee:', employee);
            // Could set additional employee-specific data here if needed
          }
        } catch (error) {
          console.log('User is not an employee or error fetching employee data:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to admin role on any error
      setUserRole('admin');
      setInterfaceRole('admin');
      setUsername('admin');
    }
  };

  // Set up Supabase auth for all users
  useEffect(() => {
    let mounted = true;
    
    // Fallback timeout to prevent infinite loading - reduced to 3 seconds
    const fallbackTimeout = setTimeout(() => {
      if (mounted && !isInitialized) {
        console.warn('Auth initialization timeout, forcing initialization');
        // Clear any problematic state and force initialization
        setUserRole('admin');
        setInterfaceRole('admin');
        setUsername('admin');
        setIsInitialized(true);
      }
    }, 3000);

    const cleanup = () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Supabase auth state changed:', event, session?.user?.id || 'NO_USER');
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User found, fetching profile...');
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id).finally(() => {
                if (mounted) {
                  console.log('Setting initialized to true (with user)');
                  setIsInitialized(true);
                }
              });
            }
          }, 0);
        } else {
          console.log('No user, setting initialized to true');
          setUserRole(null);
          setInterfaceRole(null);
          setUsername(null);
          setIsInitialized(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session check:', session?.user?.id || 'NO_USER');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Initial user found, fetching profile...');
        setTimeout(() => {
          if (mounted) {
            fetchUserProfile(session.user.id).finally(() => {
              if (mounted) {
                console.log('Setting initialized to true (initial with user)');
                setIsInitialized(true);
              }
            });
          }
        }, 0);
      } else {
        console.log('No initial user, setting initialized to true');
        setIsInitialized(true);
      }
    });

    return () => {
      cleanup();
      subscription.unsubscribe();
    };
  }, []); // Remove isInitialized dependency to prevent infinite recreation

  return {
    user,
    session,
    userRole,
    interfaceRole,
    username,
    isInitialized,
    setUserRole,
    setInterfaceRole,
    setUsername,
    setUser,
    setSession,
    fetchUserProfile
  };
}
