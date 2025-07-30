import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "super_admin" | "admin" | "manager" | "inventory_manager" | "salesperson" | "technician";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isLoggedIn, userRole } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Check for hierarchical permissions
    const roleHierarchy = {
      "super_admin": 6,
      "admin": 5, 
      "manager": 4,
      "inventory_manager": 3,
      "technician": 2,
      "salesperson": 1
    };

    const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}