
import React, { useState } from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { AuthFlow } from "@/components/app/AuthFlow";
import { UserRole } from "@/types/roles";

function App() {
  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole | null>(null);

  const handleAuthComplete = (role: UserRole) => {
    setAuthenticatedRole(role);
  };

  // Show authentication flow if user is not authenticated
  if (!authenticatedRole) {
    return (
      <AppProviders>
        <AuthFlow onAuthComplete={handleAuthComplete} />
      </AppProviders>
    );
  }

  // Show the main application with authentication context
  return (
    <AppProviders includeAuth>
      <AppRouter userRole={authenticatedRole} />
    </AppProviders>
  );
}

export default App;
