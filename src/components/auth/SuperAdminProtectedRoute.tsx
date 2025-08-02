import React from "react";
import { Navigate } from "react-router-dom";
import { useCurrentUserRole } from "@/hooks/useRoleManagement";
import { roleUtils } from "@/utils/roleUtils";
import { UserRole } from "@/types/roles";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
}

export function ProtectedRoute({ children, requiredRole, requiredRoles }: ProtectedRouteProps) {
  const { data: currentRole, isLoading } = useCurrentUserRole();

  // Show loading while checking role
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If no role is found, redirect to login
  if (!currentRole) {
    return <Navigate to="/" replace />;
  }

  // Check single required role
  if (requiredRole && !roleUtils.hasPermissionLevel(currentRole, requiredRole)) {
    return <Navigate to="/" replace />;
  }

  // Check multiple required roles (user must have one of them)
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAnyRole = requiredRoles.some(role => 
      roleUtils.hasPermissionLevel(currentRole, role)
    );
    
    if (!hasAnyRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}