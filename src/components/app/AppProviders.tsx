
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/components/security/SecurityProvider";

interface AppProvidersProps {
  children: React.ReactNode;
  includeAuth?: boolean;
}

// Create a single QueryClient instance outside the component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function AppProviders({ children, includeAuth = false }: AppProvidersProps) {
  const content = includeAuth ? (
    <AuthProvider>
      {children}
    </AuthProvider>
  ) : (
    children
  );

  // Detect preview environment
  const isPreview = typeof window !== 'undefined' && (
    window.location.hostname.includes('lovable.app') || 
    window.location.hostname.includes('localhost') ||
    window !== window.top
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Only wrap with SecurityProvider in production environments */}
        {isPreview ? (
          <>
            {content}
            <Toaster />
            <Sonner />
          </>
        ) : (
          <SecurityProvider>
            {content}
            <Toaster />
            <Sonner />
          </SecurityProvider>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
