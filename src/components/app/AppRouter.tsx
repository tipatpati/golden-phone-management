
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TabletLayout } from "@/components/layout/TabletLayout";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/roles";
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

function LoadingScreen({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">{message}</div>
    </div>
  );
}

function ProtectedPage({ children, userRole }: { children: React.ReactNode; userRole: UserRole }) {
  return (
    <TabletLayout userRole={userRole}>
      {children}
    </TabletLayout>
  );
}

export function AppRouter() {
  const { isLoggedIn, userRole, isInitialized } = useAuth();

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  const role: UserRole = userRole || 'admin';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <ProtectedPage userRole={role}>
            <Dashboard />
          </ProtectedPage>
        } />
        
        <Route path="/sales" element={
          <ProtectedPage userRole={role}>
            <Sales />
          </ProtectedPage>
        } />
        
        <Route path="/clients" element={
          <ProtectedPage userRole={role}>
            <Clients />
          </ProtectedPage>
        } />
        
        <Route path="/inventory" element={
          <ProtectedPage userRole={role}>
            <Inventory />
          </ProtectedPage>
        } />
        
        <Route path="/suppliers" element={
          <ProtectedPage userRole={role}>
            <Suppliers />
          </ProtectedPage>
        } />
        
        <Route path="/repairs" element={
          <ProtectedPage userRole={role}>
            <Repairs />
          </ProtectedPage>
        } />

        {role === 'admin' && (
          <>
            <Route path="/employees" element={
              <ProtectedPage userRole={role}>
                <EmployeeManagement />
              </ProtectedPage>
            } />
            
            <Route path="/reports" element={
              <ProtectedPage userRole={role}>
                <div className="min-h-[80vh] flex items-center justify-center">
                  <h1 className="text-2xl">Reports Module - Coming Soon</h1>
                </div>
              </ProtectedPage>
            } />
            
            <Route path="/settings" element={
              <ProtectedPage userRole={role}>
                <div className="min-h-[80vh] flex items-center justify-center">
                  <h1 className="text-2xl">Settings Module - Coming Soon</h1>
                </div>
              </ProtectedPage>
            } />
          </>
        )}

        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
