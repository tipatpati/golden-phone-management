
import React, { createContext, useContext, useEffect } from "react";
import { AuthContextType } from "./auth/types";
import { useAuthState } from "./auth/useAuthState";
import { createAuthActions } from "./auth/authActions";
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { usePeriodicReminder } from '@/hooks/usePeriodicReminder';
import { logSessionActivity } from '@/utils/securityAudit';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('AuthProvider rendering...');
  const authState = useAuthState();
  console.log('AuthProvider authState:', { 
    user: !!authState.user, 
    session: !!authState.session, 
    isInitialized: authState.isInitialized 
  });
  
  // Disable custom session security to rely on Supabase's built-in token management
  // const { isSessionValid, resetActivity } = useSessionSecurity({
  //   timeoutMinutes: 1440, // 24 hours
  //   maxIdleMinutes: 720,  // 12 hours - very long idle time
  //   detectConcurrentSessions: false // Disabled
  // });
  
  const authActions = createAuthActions({
    user: authState.user,
    setUserRole: authState.setUserRole,
    setInterfaceRole: authState.setInterfaceRole,
    setUsername: authState.setUsername,
    setUser: authState.setUser,
    setSession: authState.setSession
  });

  const isLoggedIn = !!authState.session || !!authState.user;

  // Set up 60-minute reminder system
  usePeriodicReminder({
    intervalMinutes: 60,
    title: "Work Reminder",
    message: "You've been working for an hour. Consider saving your progress and taking a short break!",
    enabled: isLoggedIn
  });

  // Log session activities (only if not in preview environment)
  useEffect(() => {
    const isPreview = window.location.hostname.includes('lovable.app') || 
                     window.location.hostname.includes('localhost') ||
                     window !== window.top;
    
    if (authState.user && !isPreview) {
      logSessionActivity('login').catch(err => 
        console.warn('Session activity logging failed:', err)
      );
    }
  }, [authState.user]);

  return (
    <AuthContext.Provider value={{ 
      user: authState.user,
      session: authState.session,
      isLoggedIn, 
      userRole: authState.userRole, 
      interfaceRole: authState.interfaceRole,
      username: authState.username,
      isInitialized: authState.isInitialized,
      ...authActions
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
