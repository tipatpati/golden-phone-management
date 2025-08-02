import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { logger } from "@/utils/logger";

export default function App() {
  console.log('App component rendering...');
  
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Error boundary triggered:', error);
    logger.error('Application error boundary triggered', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }, 'App');
  };

  return (
    <ErrorBoundary onError={handleError}>
      <AppProviders includeAuth>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}