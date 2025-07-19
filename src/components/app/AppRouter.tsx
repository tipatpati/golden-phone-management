
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmployeeDashboard } from "@/pages/employee/EmployeeDashboard";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Sales from "@/pages/Sales";
import Inventory from "@/pages/Inventory";
import Suppliers from "@/pages/Suppliers";
import Repairs from "@/pages/Repairs";
import EmployeeManagement from "@/pages/EmployeeManagement";
import NotFound from "@/pages/NotFound";
import { AuthFlow } from "@/components/app/AuthFlow";

export function AppRouter() {
  const { isLoggedIn, userRole, user } = useAuth();

  // Show loading only if we have a user but no role yet (brief loading state)
  if (user && !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading user profile...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - redirect to main app if already logged in */}
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/" replace /> : <AuthFlow onAuthComplete={() => {}} />
        } />
        
        {/* Redirect unauthenticated users to login */}
        {!isLoggedIn && <Route path="/" element={<Navigate to="/login" replace />} />}
        
        {/* Protected routes for authenticated users */}
        {isLoggedIn && (
          <>
            {/* Admin users get full admin interface */}
            {userRole === 'admin' ? (
              <>
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
                <Route path="/suppliers" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Suppliers />
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
                <Route path="/employees" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EmployeeManagement />
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
              </>
            ) : (
              /* Employee interface for non-admin roles */
              <>
                <Route path="/" element={
                  <EmployeeLayout userRole={userRole || 'salesperson'}>
                    <EmployeeDashboard userRole={userRole || 'salesperson'} />
                  </EmployeeLayout>
                } />
                <Route path="/sales" element={
                  <EmployeeLayout userRole={userRole || 'salesperson'}>
                    <Sales />
                  </EmployeeLayout>
                } />
                <Route path="/clients" element={
                  <EmployeeLayout userRole={userRole || 'salesperson'}>
                    <Clients />
                  </EmployeeLayout>
                } />
                <Route path="/inventory" element={
                  <EmployeeLayout userRole={userRole || 'salesperson'}>
                    <Inventory />
                  </EmployeeLayout>
                } />
                <Route path="/suppliers" element={
                  <EmployeeLayout userRole={userRole || 'salesperson'}>
                    <Suppliers />
                  </EmployeeLayout>
                } />
                <Route path="/repairs" element={
                  <EmployeeLayout userRole={userRole || 'salesperson'}>
                    <Repairs />
                  </EmployeeLayout>
                } />
              </>
            )}
          </>
        )}
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
