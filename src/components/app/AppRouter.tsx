
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmployeeLayout } from "@/components/layout/EmployeeLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmployeeDashboard } from "@/pages/employee/EmployeeDashboard";
import { UserRole } from "@/types/roles";
import Dashboard from "@/pages/Dashboard";
import Clients from "@/pages/Clients";
import Sales from "@/pages/Sales";
import Inventory from "@/pages/Inventory";
import Repairs from "@/pages/Repairs";
import NotFound from "@/pages/NotFound";

interface AppRouterProps {
  userRole: UserRole;
}

export function AppRouter({ userRole }: AppRouterProps) {
  // Admin gets the full interface
  if (userRole === 'admin') {
    return (
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
    );
  }

  // Employee gets simplified interface
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <EmployeeLayout userRole={userRole}>
            <EmployeeDashboard userRole={userRole} />
          </EmployeeLayout>
        } />
        <Route path="/sales" element={
          <EmployeeLayout userRole={userRole}>
            <Sales />
          </EmployeeLayout>
        } />
        <Route path="/clients" element={
          <EmployeeLayout userRole={userRole}>
            <Clients />
          </EmployeeLayout>
        } />
        <Route path="/inventory" element={
          <EmployeeLayout userRole={userRole}>
            <Inventory />
          </EmployeeLayout>
        } />
        <Route path="/repairs" element={
          <EmployeeLayout userRole={userRole}>
            <Repairs />
          </EmployeeLayout>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
