
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
        // Get user email from the current session for username
        const currentSession = await supabase.auth.getSession();
        const userEmail = currentSession.data.session?.user?.email;
        setUsername(userEmail?.split('@')[0] || 'user');
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

  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserRole(null);
          setInterfaceRole(null);
          setUsername(null);
        }
        
        setIsInitialized(true);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id).finally(() => {
          if (mounted) setIsInitialized(true);
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
