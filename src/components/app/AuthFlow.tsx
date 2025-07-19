
import React, { useState, useEffect } from "react";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { LoginForm } from "@/components/auth/LoginForm";
import { UserRole } from "@/types/roles";
import { secureStorage } from "@/services/secureStorage";

interface AuthFlowProps {
  onAuthComplete: (role: UserRole) => void;
  onAuthError?: () => void;
}

export function AuthFlow({ onAuthComplete, onAuthError }: AuthFlowProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log('AuthFlow: Checking existing auth...');
    const token = secureStorage.getItem('authToken', true);
    const role = secureStorage.getItem('userRole', false) as UserRole;
    
    if (token && token !== 'invalid-token' && role) {
      console.log('AuthFlow: Found valid auth, role:', role);
      setSelectedRole(role);
      setIsAuthenticated(true);
      onAuthComplete(role);
    } else {
      console.log('AuthFlow: No valid auth found');
      // Clear any invalid tokens
      secureStorage.removeItem('authToken');
      secureStorage.removeItem('userRole');
      secureStorage.removeItem('userId');
    }
  }, [onAuthComplete]);

  const handleRoleSelect = (role: UserRole) => {
    console.log('AuthFlow: Role selected:', role);
    setSelectedRole(role);
    // Store the selected role and continue with the same login page
    secureStorage.setItem('selectedRole', role, false);
  };

  const handleLoginSuccess = () => {
    console.log('AuthFlow: Login successful');
    // The useAuth context will handle the rest
  };

  // Show role selector if no role is selected
  if (!selectedRole) {
    return <RoleSelector onRoleSelect={handleRoleSelect} />;
  }

  // Show login form after role selection
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return null;
}
