
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/store/StoreContext";
import { OrchestrationProvider } from "@/services/core/OrchestrationProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { PWAUpdatePrompt } from "@/components/pwa/PWAUpdatePrompt";
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
      <StoreProvider>
        {children}
      </StoreProvider>
    </AuthProvider>
  ) : (
    children
  );

    return (
      <BrowserRouter>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <OrchestrationProvider>
              {content}
              <Toaster />
              <PWAInstallPrompt />
              <PWAUpdatePrompt />
            </OrchestrationProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  } catch (error) {
    logger.error('AppProviders failed', error, 'AppProviders');
    return <div>EMERGENCY: AppProviders failed</div>;
  }
}
