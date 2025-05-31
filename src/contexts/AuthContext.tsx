
import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/services/api";

interface AuthContextType {
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkAuthStatus = () => {
    const isAuthenticated = authApi.isLoggedIn();
    setIsLoggedIn(isAuthenticated);
  };

  const login = async (username: string, password: string) => {
    await authApi.login(username, password);
    setIsLoggedIn(true);
  };

  const logout = () => {
    authApi.logout();
    // Clear role-specific data
    localStorage.removeItem('userRole');
    setIsLoggedIn(false);
    // Reload to reset the app state
    window.location.reload();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, checkAuthStatus }}>
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
