
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
// import { SecurityProvider } from "@/components/security/SecurityProvider"; // Disabled

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
  console.log('AppProviders rendering with includeAuth:', includeAuth);
  
  try {
    const content = includeAuth ? (
      <AuthProvider>
        {children}
      </AuthProvider>
    ) : (
      children
    );

    console.log('AppProviders: About to render providers...');

    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* SecurityProvider completely disabled for all environments */}
          {content}
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('Error in AppProviders:', error);
    return (
      <div style={{ padding: '20px', color: 'red', fontFamily: 'Arial' }}>
        <h2>AppProviders Error</h2>
        <p>Error: {error?.message || 'Unknown error'}</p>
        <pre style={{ background: '#f0f0f0', padding: '10px' }}>
          {error?.stack || 'No stack trace available'}
        </pre>
      </div>
    );
  }
}
