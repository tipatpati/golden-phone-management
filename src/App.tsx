
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <MainLayout>
              <Dashboard />
            </MainLayout>
          } />
          <Route path="/clients" element={
            <MainLayout>
              <div className="min-h-[80vh] flex items-center justify-center">
                <h1 className="text-2xl">Clients Module - Coming Soon</h1>
              </div>
            </MainLayout>
          } />
          <Route path="/inventory" element={
            <MainLayout>
              <Inventory />
            </MainLayout>
          } />
          <Route path="/repairs" element={
            <MainLayout>
              <div className="min-h-[80vh] flex items-center justify-center">
                <h1 className="text-2xl">Repairs Module - Coming Soon</h1>
              </div>
            </MainLayout>
          } />
          <Route path="/reports" element={
            <MainLayout>
              <div className="min-h-[80vh] flex items-center justify-center">
                <h1 className="text-2xl">Reports Module - Coming Soon</h1>
              </div>
            </MainLayout>
          } />
          <Route path="/settings" element={
            <MainLayout>
              <div className="min-h-[80vh] flex items-center justify-center">
                <h1 className="text-2xl">Settings Module - Coming Soon</h1>
              </div>
            </MainLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
