
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

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
  logger.debug('AppProviders rendering', { includeAuth }, 'AppProviders');
  
  try {
    const content = includeAuth ? (
      <AuthProvider>
        {children}
      </AuthProvider>
    ) : (
      children
    );

    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {content}
          <Toaster />
        </QueryClientProvider>
      </BrowserRouter>
    );
  } catch (error) {
    logger.error('AppProviders failed', error, 'AppProviders');
    return <div>EMERGENCY: AppProviders failed</div>;
  }
}
