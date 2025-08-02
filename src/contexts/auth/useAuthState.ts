import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/roles";
import { logger } from "@/utils/logger";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [interfaceRole, setInterfaceRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const log = logger;

  const fetchUserProfile = async () => {
    if (!user?.id) {
      log.debug('No user ID available for profile fetch', null, 'AuthState');
      return;
    }

    try {
      log.debug('Fetching user profile', { userId: user.id }, 'AuthState');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        log.error('Error fetching user profile', error, 'AuthState');
        // Set default role for users without profiles
        setUserRole('salesperson');
        setInterfaceRole('salesperson');
        return;
      }

      if (profile) {
        log.debug('Profile fetched successfully', profile, 'AuthState');
        setUserRole(profile.role);
        setInterfaceRole(profile.role);
        setUsername(profile.username);
      } else {
        log.warn('No profile found for user', { userId: user.id }, 'AuthState');
        // Set default role for users without profiles
        setUserRole('salesperson');
        setInterfaceRole('salesperson');
      }
    } catch (error) {
      log.error('Failed to fetch user profile', error, 'AuthState');
      // Set default role on any error
      setUserRole('salesperson');
      setInterfaceRole('salesperson');
    }
  };

  useEffect(() => {
    let mounted = true;
    let authSubscription: any;

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          log.error('Error getting session', error, 'AuthState');
          setIsInitialized(true);
          return;
        }

        // Set session and user
        setSession(currentSession);
        setUser(currentSession?.user || null);

        // Fetch profile if user exists
        if (currentSession?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, role')
              .eq('id', currentSession.user.id)
              .maybeSingle();

            if (mounted && profile) {
              setUserRole(profile.role);
              setInterfaceRole(profile.role);
              setUsername(profile.username);
            } else if (mounted) {
              // Default role for users without profiles
              setUserRole('salesperson');
              setInterfaceRole('salesperson');
            }
          } catch (profileError) {
            log.error('Profile fetch error', profileError, 'AuthState');
            if (mounted) {
              setUserRole('salesperson');
              setInterfaceRole('salesperson');
            }
          }
        }

        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        log.error('Auth initialization error', error, 'AuthState');
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state listener
    authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      log.debug(`Auth event: ${event}`, { hasSession: !!session }, 'AuthState');
      
      setSession(session);
      setUser(session?.user || null);

      if (session?.user && event === 'SIGNED_IN') {
        // Fetch profile for signed in user
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (mounted && profile) {
            setUserRole(profile.role);
            setInterfaceRole(profile.role);
            setUsername(profile.username);
          } else if (mounted) {
            setUserRole('salesperson');
            setInterfaceRole('salesperson');
          }
        } catch (error) {
          log.error('Profile fetch on sign in failed', error, 'AuthState');
          if (mounted) {
            setUserRole('salesperson');
            setInterfaceRole('salesperson');
          }
        }
      } else if (!session?.user) {
        // Clear user state on sign out
        setUserRole(null);
        setInterfaceRole(null);
        setUsername(null);
      }
    });

    // Initialize auth
    initAuth();

    // Cleanup function
    return () => {
      mounted = false;
      if (authSubscription?.subscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, []); // Only run once on mount

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