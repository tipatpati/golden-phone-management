
import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import Index from "@/pages/Index";
import { useAuth } from "@/contexts/AuthContext";

function AppContent() {
  const { isLoggedIn, userRole, user } = useAuth();

  // Show index page if user is not authenticated
  if (!isLoggedIn) {
    return <Index />;
  }

  // Show loading only if we have a user but no role yet (brief loading state)
  if (user && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading user profile...</div>
      </div>
    );
  }

  // Show the main application
  return <AppRouter />;
}

export default function App() {
  return (
    <AppProviders includeAuth>
      <AppContent />
    </AppProviders>
  );
}
