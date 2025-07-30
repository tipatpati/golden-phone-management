
import React, { createContext, useContext } from "react";
import { AuthContextType } from "./auth/types";
import { useAuthState } from "./auth/useAuthState";
import { createAuthActions } from "./auth/authActions";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const authState = useAuthState();
  
  const authActions = createAuthActions({
    user: authState.user,
    setUserRole: authState.setUserRole,
    setInterfaceRole: authState.setInterfaceRole,
    setUsername: authState.setUsername,
    setUser: authState.setUser,
    setSession: authState.setSession
  });

  const isLoggedIn = !!authState.session;

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
