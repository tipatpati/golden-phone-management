
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { SecurityHeaders } from "@/components/security/SecurityHeaders";
import { EnhancedSecurityMonitor } from "@/components/security/EnhancedSecurityMonitor";

interface AppProvidersProps {
  children: React.ReactNode;
  includeAuth?: boolean;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export function AppProviders({ children, includeAuth = false }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SecurityHeaders />
      <TooltipProvider>
        {includeAuth ? (
          <AuthProvider>
            <EnhancedSecurityMonitor />
            {children}
          </AuthProvider>
        ) : (
          children
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
