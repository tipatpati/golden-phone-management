
import React, { useState, useEffect } from "react";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { EmployeeLogin } from "@/components/auth/EmployeeLogin";
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
  };

  const handleLoginSuccess = (role: UserRole) => {
    console.log('AuthFlow: Login successful for role:', role);
    setSelectedRole(role);
    setIsAuthenticated(true);
    onAuthComplete(role);
  };

  const handleLoginError = () => {
    console.log('AuthFlow: Login error');
    if (onAuthError) {
      onAuthError();
    }
  };

  const handleBack = () => {
    console.log('AuthFlow: Going back to role selector');
    setSelectedRole(null);
  };

  // Show role selector if no role is selected
  if (!selectedRole) {
    return <RoleSelector onRoleSelect={handleRoleSelect} />;
  }

  // Show login form if role is selected but not authenticated
  if (selectedRole && !isAuthenticated) {
    return (
      <EmployeeLogin 
        role={selectedRole} 
        onBack={handleBack}
        onLoginSuccess={handleLoginSuccess}
        onLoginError={handleLoginError}
      />
    );
  }

  return null;
}
