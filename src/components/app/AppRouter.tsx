
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmployeeDashboard } from "@/pages/employee/EmployeeDashboard";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Sales from "@/pages/Sales";
import Inventory from "@/pages/Inventory";
import Repairs from "@/pages/Repairs";
import ApiSettings from "@/pages/ApiSettings";
import NotFound from "@/pages/NotFound";
import Index from "@/pages/Index";
import AdminLogin from "@/pages/AdminLogin";

export function AppRouter() {
  const { userRole } = useAuth();

  // Default to salesperson if no role is set (fallback)
  const effectiveRole = userRole || 'salesperson';

  // Admin gets the full interface
  if (effectiveRole === 'admin') {
    return (
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/api-settings" element={<ApiSettings />} />
          
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
    );
  }

  // Employee gets simplified interface
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/api-settings" element={<ApiSettings />} />
        
        <Route path="/" element={
          <EmployeeLayout userRole={effectiveRole}>
            <EmployeeDashboard userRole={effectiveRole} />
          </EmployeeLayout>
        } />
        <Route path="/sales" element={
          <EmployeeLayout userRole={effectiveRole}>
            <Sales />
          </EmployeeLayout>
        } />
        <Route path="/clients" element={
          <EmployeeLayout userRole={effectiveRole}>
            <Clients />
          </EmployeeLayout>
        } />
        <Route path="/inventory" element={
          <EmployeeLayout userRole={effectiveRole}>
            <Inventory />
          </EmployeeLayout>
        } />
        <Route path="/repairs" element={
          <EmployeeLayout userRole={effectiveRole}>
            <Repairs />
          </EmployeeLayout>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
