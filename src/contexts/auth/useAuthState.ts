
import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { UserRole } from "@/types/roles";
import { supabase } from "@/integrations/supabase/client";
import { log } from "@/utils/logger";

export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [interfaceRole, setInterfaceRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    try {
      log.debug('Fetching user profile', { userId }, 'AuthState');
      
      // Use Promise.race for timeout functionality  
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
      });
      
      const profilePromise = supabase
        .from('profiles')
        .select('username, role')
        .eq('id', userId)
        .single();
      
      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;
      
        if (profileError) {
          log.error('Error fetching user profile', profileError, 'AuthState');
          // STRICT AUTH: No fallback admin roles - force logout on profile errors
          log.warn('Profile not found or error occurred. User must have valid profile.', null, 'AuthState');
          await supabase.auth.signOut();
          setUserRole(null);
        setInterfaceRole(null);
        setUsername(null);
        return;
      }
      
        if (!profile) {
          log.error('No profile found for authenticated user', null, 'AuthState');
        // STRICT AUTH: No profile = no access
        await supabase.auth.signOut();
        setUserRole(null);
        setInterfaceRole(null);
        setUsername(null);
        return;
      }
      
        // Valid profile found - set user data
        log.info('User profile fetched successfully', { role: profile.role, username: profile.username }, 'AuthState');
      setUserRole(profile.role as UserRole);
      setInterfaceRole(profile.role as UserRole);
      setUsername(profile.username || profile.role);
      
      // Optional: Check if this user is also an employee
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
            log.debug('User is also an employee', { position: employee.position }, 'AuthState');
          // Could set additional employee-specific data here if needed
        }
      } catch (error) {
          // Employee data is optional - don't fail auth for this
          log.debug('User is not an employee or error fetching employee data', error, 'AuthState');
      }
    } catch (error) {
      log.error('Error fetching user profile', error, 'AuthState');
      // STRICT AUTH: On any error, sign out and clear state
      log.warn('Authentication error occurred. Signing out user.', null, 'AuthState');
      await supabase.auth.signOut();
      setUserRole(null);
      setInterfaceRole(null);
      setUsername(null);
    }
  };

  // Set up Supabase auth for all users
  useEffect(() => {
    let mounted = true;
    
    // Strict timeout to prevent infinite loading - no fallback roles
    const fallbackTimeout = setTimeout(() => {
      if (mounted && !isInitialized) {
        log.warn('Auth initialization timeout, completing initialization without auth', null, 'AuthState');
        // STRICT AUTH: Just mark as initialized, don't assign roles
        setIsInitialized(true);
      }
    }, 5000);

    const cleanup = () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log.debug('Supabase auth state changed', { event, hasUser: !!session?.user }, 'AuthState');
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          log.debug('User found, fetching profile...', null, 'AuthState');
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id).finally(() => {
                if (mounted) {
                  log.debug('Setting initialized to true (with user)', null, 'AuthState');
                  setIsInitialized(true);
                }
              });
            }
          }, 0);
        } else {
          log.debug('No user, setting initialized to true', null, 'AuthState');
          setUserRole(null);
          setInterfaceRole(null);
          setUsername(null);
          setIsInitialized(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      log.debug('Initial session check', { hasUser: !!session?.user }, 'AuthState');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        log.debug('Initial user found, fetching profile...', null, 'AuthState');
        setTimeout(() => {
          if (mounted) {
            fetchUserProfile(session.user.id).finally(() => {
              if (mounted) {
                log.debug('Setting initialized to true (initial with user)', null, 'AuthState');
                setIsInitialized(true);
              }
            });
          }
        }, 0);
      } else {
        log.debug('No initial user, setting initialized to true', null, 'AuthState');
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
