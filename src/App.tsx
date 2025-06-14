
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { AuthFlow } from "@/components/app/AuthFlow";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/roles";
import ApiSettings from "@/pages/ApiSettings";

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
    return (
      <BrowserRouter>
        <Routes>
          {/* Public API Settings route - accessible without login */}
          <Route path="/api-settings" element={<ApiSettings />} />
          {/* All other routes go to login */}
          <Route path="*" element={<LoginForm onLoginSuccess={() => {}} />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Show the main application with authentication context
  const authenticatedRole = (userRole as UserRole) || 'admin';
  return <AppRouter userRole={authenticatedRole} />;
}

function App() {
  return (
    <AppProviders includeAuth>
      <AppContent />
    </AppProviders>
  );
}

export default App;
