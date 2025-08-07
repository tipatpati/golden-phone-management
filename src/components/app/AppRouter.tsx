import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TabletLayout } from "@/components/layout/TabletLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserRole } from "@/hooks/useRoleManagement";
import { roleUtils } from "@/utils/roleUtils";
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
const Profile = React.lazy(() => import("@/pages/Profile"));
const Documentation = React.lazy(() => import("@/pages/Documentation"));
const Finances = React.lazy(() => import("@/pages/Finances"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

export function AppRouter() {
  const { isLoggedIn, user, isInitialized, userRole } = useAuth();
  
  console.log('🚀 AppRouter Debug:', {
    isLoggedIn,
    userId: user?.id,
    isInitialized,
    userRole
  });

  // TEMPORARY FIX: Use the role from AuthContext instead of the problematic hook
  const effectiveRole = userRole || 'salesperson';
  
  console.log('✅ AppRouter proceeding with role from AuthContext:', effectiveRole);

  // Show loading only while auth is being initialized
  if (!isInitialized) {
    console.log('⏳ AppRouter showing loading for auth initialization...');
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route - login if not authenticated, main app if authenticated */}
        <Route path="/" element={
          isLoggedIn ? (
            roleUtils.hasPermissionLevel(effectiveRole, 'admin') ? (
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <EmployeeDashboard userRole={effectiveRole} />
                </Suspense>
              </ProtectedRoute>
            ) : (
              <ProtectedRoute>
                <Suspense fallback={<PageLoader />}>
                  <EmployeeDashboard userRole={effectiveRole} />
                </Suspense>
              </ProtectedRoute>
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
            {/* Super Admin and Admin users get full admin interface */}
            {roleUtils.hasPermissionLevel(effectiveRole, 'admin') ? (
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
                <Route path="/finances" element={
                  effectiveRole === 'super_admin' ? (
                    <ProtectedRoute>
                      <TabletLayout userRole={effectiveRole}>
                        <Suspense fallback={<PageLoader />}>
                          <Finances />
                        </Suspense>
                      </TabletLayout>
                    </ProtectedRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
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
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <Profile />
                      </Suspense>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
                <Route path="/documentation" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <Documentation />
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
                  (roleUtils.canAccessFeature(effectiveRole, 'sales_management') || effectiveRole === 'salesperson') ? (
                    <ProtectedRoute>
                      <TabletLayout userRole={effectiveRole}>
                        <Suspense fallback={<PageLoader />}>
                          <Sales />
                        </Suspense>
                      </TabletLayout>
                    </ProtectedRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />
                <Route path="/clients" element={
                  ['salesperson', 'manager', 'technician'].includes(effectiveRole || '') ? (
                    <ProtectedRoute>
                      <TabletLayout userRole={effectiveRole}>
                        <Suspense fallback={<PageLoader />}>
                          <Clients />
                        </Suspense>
                      </TabletLayout>
                    </ProtectedRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />
                <Route path="/inventory" element={
                  ['manager', 'inventory_manager', 'salesperson', 'technician'].includes(effectiveRole || '') ? (
                    <ProtectedRoute>
                      <TabletLayout userRole={effectiveRole}>
                        <Suspense fallback={<PageLoader />}>
                          <Inventory />
                        </Suspense>
                      </TabletLayout>
                    </ProtectedRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />
                <Route path="/suppliers" element={
                  ['manager', 'inventory_manager'].includes(effectiveRole || '') ? (
                    <ProtectedRoute>
                      <TabletLayout userRole={effectiveRole}>
                        <Suspense fallback={<PageLoader />}>
                          <Suppliers />
                        </Suspense>
                      </TabletLayout>
                    </ProtectedRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />
                <Route path="/repairs" element={
                  ['manager', 'technician'].includes(effectiveRole || '') ? (
                    <ProtectedRoute>
                      <TabletLayout userRole={effectiveRole}>
                        <Suspense fallback={<PageLoader />}>
                          <Repairs />
                        </Suspense>
                      </TabletLayout>
                    </ProtectedRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <TabletLayout userRole={effectiveRole}>
                      <Suspense fallback={<PageLoader />}>
                        <Profile />
                      </Suspense>
                    </TabletLayout>
                  </ProtectedRoute>
                } />
              </>
            )}
          </>
        )}
        
        {/* Redirect unauthenticated users trying to access protected routes */}
        {!isLoggedIn && (
          <>
            <Route path="/profile" element={<Navigate to="/" replace />} />
            <Route path="/employees" element={<Navigate to="/" replace />} />
            <Route path="/sales" element={<Navigate to="/" replace />} />
            <Route path="/clients" element={<Navigate to="/" replace />} />
            <Route path="/inventory" element={<Navigate to="/" replace />} />
            <Route path="/suppliers" element={<Navigate to="/" replace />} />
            <Route path="/repairs" element={<Navigate to="/" replace />} />
            <Route path="/finances" element={<Navigate to="/" replace />} />
            <Route path="/reports" element={<Navigate to="/" replace />} />
            <Route path="/settings" element={<Navigate to="/" replace />} />
          </>
        )}
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}