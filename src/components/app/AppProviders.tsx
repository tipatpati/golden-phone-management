
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { EnhancedSecurityProvider } from "@/components/security/EnhancedSecurityProvider";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { EnhancedSecurityMonitor } from "@/components/security/EnhancedSecurityMonitor";

interface AppProvidersProps {
  children: React.ReactNode;
  includeAuth?: boolean;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

export function AppProviders({ children, includeAuth = true }: AppProvidersProps) {
  const content = includeAuth ? (
    <AuthProvider>
      <EnhancedSecurityMonitor />
      {children}
    </AuthProvider>
  ) : (
    children
  );

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SecurityHeaders />
        <SecurityProvider>
          <EnhancedSecurityProvider>
            {content}
            <Toaster />
          </EnhancedSecurityProvider>
        </SecurityProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
