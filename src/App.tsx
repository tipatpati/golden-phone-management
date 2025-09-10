import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { logger } from "@/utils/logger";
import { bootstrapServices } from "@/services/core";

export default function App() {
  React.useEffect(() => {
    logger.info('App mounted successfully', {}, 'App');
    // Initialize enhanced service management system
    bootstrapServices().catch((error) => {
      logger.error('Failed to bootstrap services', error, 'App');
    });
    return () => logger.info('App unmounting', {}, 'App');
  }, []);
  
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('Application error boundary triggered', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }, 'App');
  };

  try {
    return (
      <ErrorBoundary onError={handleError}>
        <AppProviders includeAuth>
          <AppRouter />
        </AppProviders>
      </ErrorBoundary>
    );
  } catch (error) {
    logger.error('App render error', error, 'App');
    return <div>EMERGENCY FALLBACK: App failed to render</div>;
  }
}