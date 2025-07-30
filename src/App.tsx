import React from "react";
import { AppProviders } from "@/components/app/AppProviders";
import { AppRouter } from "@/components/app/AppRouter";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { logger } from "@/utils/secureLogger";

export default function App() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Application error boundary triggered:', error);
    logger.error('Application error boundary triggered', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    }, 'App');
  };

  console.log('App component rendering...');

  return (
    <ErrorBoundary onError={handleError}>
      <AppProviders includeAuth>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}