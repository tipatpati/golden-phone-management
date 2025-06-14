
import React, { useState, useEffect } from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";

function AppContent() {
  const { isLoggedIn, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give auth context time to check for existing session
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show login form if user is not authenticated
  if (!isLoggedIn) {
    return <LoginForm onLoginSuccess={() => {}} />;
  }

  // Show the main application with the user's role from Supabase
  return <AppRouter />;
}

function App() {
  return (
    <AppProviders includeAuth>
      <AppContent />
    </AppProviders>
  );
}

export default App;
