
import React, { useState, useEffect } from "react";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { UserRole } from "@/types/roles";

interface AuthFlowProps {
  onAuthComplete: (role: UserRole) => void;
  onAuthError?: () => void;
}

export function AuthFlow({ onAuthComplete, onAuthError }: AuthFlowProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('AuthFlow: Checking existing auth...');
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole') as UserRole;
    
    if (token && token !== 'mock-token' && token !== 'employee-token' && role) {
      console.log('AuthFlow: Found valid auth, role:', role);
      setSelectedRole(role);
      setIsAuthenticated(true);
      onAuthComplete(role);
    } else {
      console.log('AuthFlow: No valid auth found');
      // Clear any invalid tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    }
  }, [onAuthComplete]);

  const handleRoleSelect = (role: UserRole) => {
    console.log('AuthFlow: Role selected:', role);
    setSelectedRole(role);
    // Since we now handle login at the page level, redirect to appropriate login page
    if (role === 'admin') {
      window.location.href = '/admin-login';
    } else {
      window.location.href = '/employee-login';
    }
  };

  // Show role selector if no role is selected
  if (!selectedRole) {
    return <RoleSelector onRoleSelect={handleRoleSelect} />;
  }

  return null;
}
