
import React, { useState, useEffect } from "react";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { UserRole } from "@/types/roles";
import { secureStorage } from "@/services/secureStorage";
import { log } from "@/utils/logger";

interface AuthFlowProps {
  onAuthComplete: (role: UserRole) => void;
  onAuthError?: () => void;
}

export function AuthFlow({ onAuthComplete, onAuthError }: AuthFlowProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      log.debug('Checking existing auth...', null, 'AuthFlow');
      const token = await secureStorage.getItem('authToken', true);
      const role = await secureStorage.getItem('userRole', false) as UserRole;
      
      if (token && token !== 'invalid-token' && role) {
        log.info('Found valid auth', { role }, 'AuthFlow');
        setSelectedRole(role);
        setIsAuthenticated(true);
        onAuthComplete(role);
      } else {
        log.debug('No valid auth found', null, 'AuthFlow');
        // Clear any invalid tokens
        secureStorage.removeItem('authToken');
        secureStorage.removeItem('userRole');
        secureStorage.removeItem('userId');
      }
    };
    
    checkAuth();
  }, [onAuthComplete]);

  const handleRoleSelect = (role: UserRole) => {
    log.info('Role selected', { role }, 'AuthFlow');
    setSelectedRole(role);
    // Since we now handle login at the page level, redirect to appropriate login page
    if (role === 'admin' || role === 'super_admin') {
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
