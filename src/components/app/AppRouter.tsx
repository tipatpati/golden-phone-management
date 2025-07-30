
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TabletLayout } from "@/components/layout/TabletLayout";
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
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";

export function AppRouter() {
  const { isLoggedIn, userRole, user, isInitialized } = useAuth();

  // Show loading while auth state is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

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
        {/* Root route - login if not authenticated, main app if authenticated */}
        <Route path="/" element={
          isLoggedIn ? (
            userRole === 'admin' ? (
              <ProtectedRoute>
                <TabletLayout userRole={userRole || 'admin'}>
                  <Dashboard />
                </TabletLayout>
              </ProtectedRoute>
            ) : (
              <TabletLayout userRole={userRole || 'salesperson'}>
                <EmployeeDashboard userRole={userRole || 'salesperson'} />
              </TabletLayout>
            )
          ) : (
            <Login />
          )
        } />
        
        {/* Legacy login routes redirect to root */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/admin-login" element={<Navigate to="/" replace />} />
        <Route path="/employee-login" element={<Navigate to="/" replace />} />
        
        {/* Password reset route - accessible without authentication */}
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected routes for authenticated users */}
        {isLoggedIn && (
          <>
            {/* Admin users get full admin interface */}
            {userRole === 'admin' ? (
              <>
                <Route path="/sales" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={userRole || 'admin'}>
                      <Sales />
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={userRole || 'admin'}>
                      <Clients />
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={userRole || 'admin'}>
                      <Inventory />
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/suppliers" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={userRole || 'admin'}>
                      <Suppliers />
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/repairs" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={userRole || 'admin'}>
                      <Repairs />
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={userRole || 'admin'}>
                      <div className="min-h-[80vh] flex items-center justify-center">
                        <h1 className="text-2xl">Reports Module - Coming Soon</h1>
                      </div>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/employees" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={userRole || 'admin'}>
                      <EmployeeManagement />
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={userRole || 'admin'}>
                      <div className="min-h-[80vh] flex items-center justify-center">
                        <h1 className="text-2xl">Settings Module - Coming Soon</h1>
                      </div>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
              </>
            ) : (
              /* Employee interface for non-admin roles */
              <>
                <Route path="/sales" element={
                  <TabletLayout userRole={userRole || 'salesperson'}>
                    <Sales />
                  </TabletLayout>
                } />
                <Route path="/clients" element={
                  <TabletLayout userRole={userRole || 'salesperson'}>
                    <Clients />
                  </TabletLayout>
                } />
                <Route path="/inventory" element={
                  <TabletLayout userRole={userRole || 'salesperson'}>
                    <Inventory />
                  </TabletLayout>
                } />
                <Route path="/suppliers" element={
                  <TabletLayout userRole={userRole || 'salesperson'}>
                    <Suppliers />
                  </TabletLayout>
                } />
                <Route path="/repairs" element={
                  <TabletLayout userRole={userRole || 'salesperson'}>
                    <Repairs />
                  </TabletLayout>
                } />
              </>
            )}
          </>
        )}
        
        {/* Redirect unauthenticated users trying to access protected routes */}
        {!isLoggedIn && (
          <>
            <Route path="/employees" element={<Navigate to="/" replace />} />
            <Route path="/sales" element={<Navigate to="/" replace />} />
            <Route path="/clients" element={<Navigate to="/" replace />} />
            <Route path="/inventory" element={<Navigate to="/" replace />} />
            <Route path="/suppliers" element={<Navigate to="/" replace />} />
            <Route path="/repairs" element={<Navigate to="/" replace />} />
            <Route path="/reports" element={<Navigate to="/" replace />} />
            <Route path="/settings" element={<Navigate to="/" replace />} />
          </>
        )}
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
