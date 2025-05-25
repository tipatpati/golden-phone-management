
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "./LoginForm";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, checkAuthStatus } = useAuth();

  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={checkAuthStatus} />;
  }

  return <>{children}</>;
}
