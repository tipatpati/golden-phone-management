
import React, { useState, useEffect } from "react";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { EmployeeLogin } from "@/components/auth/EmployeeLogin";
import { UserRole } from "@/types/roles";

interface AuthFlowProps {
  onAuthComplete: (role: UserRole) => void;
}

export function AuthFlow({ onAuthComplete }: AuthFlowProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole') as UserRole;
    if (token && role) {
      setSelectedRole(role);
      setIsAuthenticated(true);
      onAuthComplete(role);
    }
  }, [onAuthComplete]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleLoginSuccess = (role: UserRole) => {
    setSelectedRole(role);
    setIsAuthenticated(true);
    onAuthComplete(role);
  };

  const handleBack = () => {
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
      />
    );
  }

  return null;
}
