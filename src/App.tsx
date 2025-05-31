
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleSelector } from "@/components/auth/RoleSelector";
import { EmployeeLogin } from "@/components/auth/EmployeeLogin";
import { EmployeeDashboard } from "@/pages/employee/EmployeeDashboard";
import { UserRole } from "@/types/roles";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Repairs from "./pages/Repairs";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole') as UserRole;
    if (token && role) {
      setSelectedRole(role);
      setIsAuthenticated(true);
    }
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleLoginSuccess = (role: UserRole) => {
    setSelectedRole(role);
    setIsAuthenticated(true);
  };

  const handleBack = () => {
    setSelectedRole(null);
  };

  // Show role selector if no role is selected
  if (!selectedRole) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RoleSelector onRoleSelect={handleRoleSelect} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Show login form if role is selected but not authenticated
  if (selectedRole && !isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <EmployeeLogin 
            role={selectedRole} 
            onBack={handleBack}
            onLoginSuccess={handleLoginSuccess}
          />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Admin gets the full interface
  if (selectedRole === 'admin') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Dashboard />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/sales" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Sales />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Clients />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Inventory />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/repairs" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Repairs />
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="min-h-[80vh] flex items-center justify-center">
                        <h1 className="text-2xl">Reports Module - Coming Soon</h1>
                      </div>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <div className="min-h-[80vh] flex items-center justify-center">
                        <h1 className="text-2xl">Settings Module - Coming Soon</h1>
                      </div>
                    </MainLayout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Employee gets simplified interface
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <EmployeeLayout userRole={selectedRole}>
                  <EmployeeDashboard userRole={selectedRole} />
                </EmployeeLayout>
              } />
              <Route path="/sales" element={
                <EmployeeLayout userRole={selectedRole}>
                  <Sales />
                </EmployeeLayout>
              } />
              <Route path="/clients" element={
                <EmployeeLayout userRole={selectedRole}>
                  <Clients />
                </EmployeeLayout>
              } />
              <Route path="/inventory" element={
                <EmployeeLayout userRole={selectedRole}>
                  <Inventory />
                </EmployeeLayout>
              } />
              <Route path="/repairs" element={
                <EmployeeLayout userRole={selectedRole}>
                  <Repairs />
                </EmployeeLayout>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
