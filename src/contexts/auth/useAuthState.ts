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
        setUserRole('salesperson');
        setInterfaceRole('salesperson');
      }
    } catch (error) {
      log.error('Failed to fetch user profile', error, 'AuthState');
      setUserRole('salesperson');
      setInterfaceRole('salesperson');
    }
  };

  useEffect(() => {
    let initialized = false;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        log.debug(`Auth event: ${event}`, { hasSession: !!session }, 'AuthState');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('username, role')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (error) {
                setUserRole('salesperson');
                setInterfaceRole('salesperson');
              } else if (profile) {
                setUserRole(profile.role);
                setInterfaceRole(profile.role);
                setUsername(profile.username);
              } else {
                setUserRole('salesperson');
                setInterfaceRole('salesperson');
              }
            } catch {
              setUserRole('salesperson');
              setInterfaceRole('salesperson');
            }
          }, 0);
        } else {
          setUserRole(null);
          setInterfaceRole(null);
          setUsername(null);
        }
        
        if (!initialized) {
          initialized = true;
          setIsInitialized(true);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        log.error('Failed to get initial session', error, 'AuthState');
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('username, role')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (error) {
                setUserRole('salesperson');
                setInterfaceRole('salesperson');
              } else if (profile) {
                setUserRole(profile.role);
                setInterfaceRole(profile.role);
                setUsername(profile.username);
              } else {
                setUserRole('salesperson');
                setInterfaceRole('salesperson');
              }
            } catch {
              setUserRole('salesperson');
              setInterfaceRole('salesperson');
            }
          }, 0);
        }
      }
      
      if (!initialized) {
        initialized = true;
        setIsInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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