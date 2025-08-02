
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
          
          // Handle different error types
          if (profileError.code === 'PGRST116') {
            // No profile found - this is expected for new users, create one
            log.info('No profile found, user needs setup', null, 'AuthState');
            setUserRole(null);
            setInterfaceRole(null); 
            setUsername(null);
            return;
          } else {
            // Other errors - sign out for security
            log.warn('Profile error, signing out for security', null, 'AuthState');
            await supabase.auth.signOut();
            setUserRole(null);
            setInterfaceRole(null);
            setUsername(null);
            return;
          }
        }
        
        if (!profile) {
          log.info('No profile data returned, user needs setup', null, 'AuthState');
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
      // For timeout errors, just continue without profile
      if (error.message?.includes('timeout')) {
        log.warn('Profile fetch timeout, continuing without profile', null, 'AuthState');
        setUserRole(null);
        setInterfaceRole(null);
        setUsername(null);
      } else {
        // For other errors, sign out
        log.warn('Authentication error occurred. Signing out user.', null, 'AuthState');
        await supabase.auth.signOut();
        setUserRole(null);
        setInterfaceRole(null);
        setUsername(null);
      }
    }
  };

  // Set up Supabase auth for all users
  useEffect(() => {
    let mounted = true;
    
    // Don't set initialized immediately - wait for auth state

    const cleanup = () => {
      mounted = false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        log.debug('Supabase auth state changed', { event, hasUser: !!session?.user }, 'AuthState');
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          log.debug('User found, fetching profile in background', null, 'AuthState');
          // Fetch profile in background without blocking initialization
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(session.user.id).catch(error => {
                log.warn('Background profile fetch failed in auth change', error, 'AuthState');
              });
            }
          }, 0);
        } else {
          log.debug('No user, clearing profile data', null, 'AuthState');
          setUserRole(null);
          setInterfaceRole(null);
          setUsername(null);
        }
        
        // Always ensure we're initialized after auth state changes
        setIsInitialized(true);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      log.debug('Initial session check', { hasUser: !!session?.user }, 'AuthState');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        log.debug('Initial user found, fetching profile...', null, 'AuthState');
        // Fetch profile in background but initialize immediately
        fetchUserProfile(session.user.id).catch(error => {
          log.warn('Background profile fetch failed', error, 'AuthState');
        });
      }
      
      // Always initialize after getting session
      setIsInitialized(true);
    }).catch(error => {
      log.error('Failed to get initial session', error, 'AuthState');
      // Even on error, initialize to prevent stuck loading
      setIsInitialized(true);
    });

    return () => {
      cleanup();
      subscription.unsubscribe();
    };
  }, []); // Remove isInitialized dependency to prevent infinite recreation

  const checkAuthStatus = () => {
    if (user?.id) {
      fetchUserProfile(user.id);
    }
  };

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
    fetchUserProfile,
    checkAuthStatus
  };
}
