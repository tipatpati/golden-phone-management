
import React, { createContext, useContext, useEffect } from "react";
import { AuthContextType } from "./auth/types";
import { useAuthState } from "./auth/useAuthState";
import { createAuthActions } from "./auth/authActions";
import { useSessionSecurity } from '@/hooks/useSessionSecurity';
import { logSessionActivity } from '@/utils/securityAudit';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authState = useAuthState();
  
  // Initialize session security monitoring
  const { isSessionValid } = useSessionSecurity({
    timeoutMinutes: 120,
    maxIdleMinutes: 30,
    detectConcurrentSessions: true
  });
  
  const authActions = createAuthActions({
    user: authState.user,
    setUserRole: authState.setUserRole,
    setInterfaceRole: authState.setInterfaceRole,
    setUsername: authState.setUsername,
    setUser: authState.setUser,
    setSession: authState.setSession
  });

  const isLoggedIn = !!authState.session || !!authState.user;

  // Log session activities
  useEffect(() => {
    if (authState.user) {
      logSessionActivity('login');
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
