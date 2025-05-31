
import React, { useState, useEffect } from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { AuthFlow } from "@/components/app/AuthFlow";
import { UserRole } from "@/types/roles";

function App() {
  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('App: Checking initial auth status...');
    
    // Check if user is already authenticated
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole') as UserRole;
    
    console.log('App: Found token:', !!token, 'Role:', role);
    
    if (token && token !== 'mock-token' && token !== 'employee-token' && role) {
      console.log('App: User already authenticated with role:', role);
      setAuthenticatedRole(role);
    }
    
    setIsLoading(false);
  }, []);

  const handleAuthComplete = (role: UserRole) => {
    console.log('App: Auth completed with role:', role);
    setAuthenticatedRole(role);
  };

  const handleAuthError = () => {
    console.log('App: Auth error, clearing state');
    setAuthenticatedRole(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show authentication flow if user is not authenticated
  if (!authenticatedRole) {
    console.log('App: Showing auth flow');
    return (
      <AppProviders>
        <AuthFlow onAuthComplete={handleAuthComplete} onAuthError={handleAuthError} />
      </AppProviders>
    );
  }

  // Show the main application with authentication context
  console.log('App: Showing main app with role:', authenticatedRole);
  return (
    <AppProviders includeAuth>
      <AppRouter userRole={authenticatedRole} />
    </AppProviders>
  );
}

export default App;
