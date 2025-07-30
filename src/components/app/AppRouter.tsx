import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TabletLayout } from "@/components/layout/TabletLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load major route components for better performance
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const Clients = React.lazy(() => import("@/pages/Clients"));
const Sales = React.lazy(() => import("@/pages/Sales"));
const Inventory = React.lazy(() => import("@/pages/Inventory"));
const Suppliers = React.lazy(() => import("@/pages/Suppliers"));
const Repairs = React.lazy(() => import("@/pages/Repairs"));
const EmployeeManagement = React.lazy(() => import("@/pages/EmployeeManagement"));
const EmployeeDashboard = React.lazy(() => import("@/pages/employee/EmployeeDashboard"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

export function AppRouter() {
  const { isLoggedIn, userRole, user, isInitialized } = useAuth();

  // Show loading while auth state is initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-lg text-gray-900">Loading...</div>
      </div>
    );
  }

  // Determine effective role based on authenticated user data only - no fallbacks
  const effectiveRole = userRole;

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route - login if not authenticated, main app if authenticated */}
        <Route path="/" element={
          isLoggedIn ? (
            effectiveRole === 'admin' ? (
              <ProtectedRoute>
                <TabletLayout userRole={effectiveRole}>
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                </TabletLayout>
              </ProtectedRoute>
            ) : (
              <TabletLayout userRole={effectiveRole}>
                <Suspense fallback={<PageLoader />}>
                  <EmployeeDashboard userRole={effectiveRole} />
                </Suspense>
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
            {effectiveRole === 'admin' ? (
              <>
                <Route path="/sales" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <Sales />
                      </Suspense>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/clients" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <Clients />
                      </Suspense>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/inventory" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <Inventory />
                      </Suspense>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/suppliers" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <Suppliers />
                      </Suspense>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/repairs" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <Repairs />
                      </Suspense>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <div className="min-h-[80vh] flex items-center justify-center">
                        <h1 className="text-2xl">Reports Module - Coming Soon</h1>
                      </div>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/employees" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <EmployeeManagement />
                      </Suspense>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
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
                  <TabletLayout userRole={effectiveRole}>
                    <Suspense fallback={<PageLoader />}>
                      <Sales />
                    </Suspense>
                  </TabletLayout>
                } />
                <Route path="/clients" element={
                  <TabletLayout userRole={effectiveRole}>
                    <Suspense fallback={<PageLoader />}>
                      <Clients />
                    </Suspense>
                  </TabletLayout>
                } />
                <Route path="/inventory" element={
                  <TabletLayout userRole={effectiveRole}>
                    <Suspense fallback={<PageLoader />}>
                      <Inventory />
                    </Suspense>
                  </TabletLayout>
                } />
                <Route path="/suppliers" element={
                  <TabletLayout userRole={effectiveRole}>
                    <Suspense fallback={<PageLoader />}>
                      <Suppliers />
                    </Suspense>
                  </TabletLayout>
                } />
                <Route path="/repairs" element={
                  <TabletLayout userRole={effectiveRole}>
                    <Suspense fallback={<PageLoader />}>
                      <Repairs />
                    </Suspense>
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