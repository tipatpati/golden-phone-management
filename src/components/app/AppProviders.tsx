
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionDebugger } from "@/components/common/PermissionDebugger";
// import { SecurityProvider } from "@/components/security/SecurityProvider"; // Disabled

interface AppProvidersProps {
  children: React.ReactNode;
  includeAuth?: boolean;
}

// Enhanced QueryClient with better caching and performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      refetchOnMount: false, // Use cached data when available
    },
    mutations: {
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* SecurityProvider completely disabled for all environments */}
        {content}
        <Toaster />
        <Sonner />
        <PermissionDebugger />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
