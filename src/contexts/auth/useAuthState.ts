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
    let isComponentMounted = true;
    
    // Immediately set initialized to prevent loading loops
    setIsInitialized(true);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isComponentMounted) return;
        
        log.debug(`Auth event: ${event}`, { hasSession: !!session }, 'AuthState');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to prevent deadlocks
          setTimeout(async () => {
            if (!isComponentMounted) return;
            
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('username, role')
                .eq('id', session.user.id)
                .maybeSingle();
              
              if (!isComponentMounted) return;
              
              if (error || !profile) {
                setUserRole('salesperson');
                setInterfaceRole('salesperson');
                setUsername(null);
              } else {
                setUserRole(profile.role);
                setInterfaceRole(profile.role);
                setUsername(profile.username);
              }
            } catch {
              if (isComponentMounted) {
                setUserRole('salesperson');
                setInterfaceRole('salesperson');
                setUsername(null);
              }
            }
          }, 100);
        } else {
          setUserRole(null);
          setInterfaceRole(null);
          setUsername(null);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isComponentMounted) return;
      
      if (error) {
        log.error('Failed to get initial session', error, 'AuthState');
        setSession(null);
        setUser(null);
        setUserRole(null);
        setInterfaceRole(null);
        setUsername(null);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          if (!isComponentMounted) return;
          
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('username, role')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (!isComponentMounted) return;
            
            if (error || !profile) {
              setUserRole('salesperson');
              setInterfaceRole('salesperson');
              setUsername(null);
            } else {
              setUserRole(profile.role);
              setInterfaceRole(profile.role);
              setUsername(profile.username);
            }
          } catch {
            if (isComponentMounted) {
              setUserRole('salesperson');
              setInterfaceRole('salesperson');
              setUsername(null);
            }
          }
        }, 100);
      } else {
        setUserRole(null);
        setInterfaceRole(null);
        setUsername(null);
      }
    });

    return () => {
      isComponentMounted = false;
      subscription.unsubscribe();
    };
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