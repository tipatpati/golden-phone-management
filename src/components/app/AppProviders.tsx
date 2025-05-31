
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
  includeAuth?: boolean;
}

export function AppProviders({ children, includeAuth = false }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {includeAuth ? (
          <AuthProvider>
            <Toaster />
            <Sonner />
            {children}
          </AuthProvider>
        ) : (
          <>
            <Toaster />
            <Sonner />
            {children}
          </>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
