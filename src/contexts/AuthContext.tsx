
import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "@/services/api";
import { toast } from "@/components/ui/sonner";

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: string | null;
  username: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const user = localStorage.getItem('userId');
    
    // Consider logged in if we have any valid token (real or mock)
    const isAuthenticated = !!token;
    
    if (isAuthenticated) {
      setIsLoggedIn(true);
      setUserRole(role);
      setUsername(user);
    } else {
      setIsLoggedIn(false);
      setUserRole(null);
      setUsername(null);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const result = await authApi.login(username, password);
      
      // Check if we got a token back (real or mock)
      const token = localStorage.getItem('authToken');
      if (token) {
        setIsLoggedIn(true);
        setUsername(username);
        
        // Try to get user role from the response or make an API call
        if (result.role) {
          setUserRole(result.role);
          localStorage.setItem('userRole', result.role);
        } else {
          // Default to admin for now, but this should come from your Django backend
          setUserRole('admin');
          localStorage.setItem('userRole', 'admin');
        }
      } else {
        throw new Error('Invalid authentication response');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoggedIn(false);
      setUserRole(null);
      setUsername(null);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setIsLoggedIn(false);
    setUserRole(null);
    setUsername(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    // Force reload to reset app state
    window.location.reload();
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      userRole, 
      username, 
      login, 
      logout, 
      checkAuthStatus 
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
